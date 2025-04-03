/**
   * unsubscribe 'transaction status' subscription
   */
  async unsubscribeTransactionStatus(transactionHash) {
    let entries = [];
    if (transactionHash) {
      const mapKey = this.encodeTransactionStatusSubscription(transactionHash);
      const subId = this.subscriptions.get(mapKey);
      if (!subId) throw Error("There is no subscription ID for this event");
      entries = [[mapKey, this.subscriptions.get(mapKey)]];
    } else
      entries = [...this.subscriptions.entries()].filter(
        ([key, _]) => key.slice(0, WSSubscriptions.TRANSACTION_STATUS.length) === WSSubscriptions.TRANSACTION_STATUS
      );
    //   const resolvePromisesSeq = async (tasks) => {
    //     const results = [];
    //     for (const task of tasks) {
    //       results.push(await task);
    //     }

    //     return results;
    //   };
    // const unsubscribePromises=entries.map(([key, data]) => {
    //  this.unsubscribe(data, key)
    //   .then((isUnsubscribed)=>{
    //     console.log("unsubscribed!");
    //     return isUnsubscribed})
    //   .catch((err)=>{throw new Error(err)});
    // })
    // const results = await resolvePromisesSeq (unsubscribePromises);
    // console.log({results});
    // return results.every((result) => result === true);

    async function asyncFn([data,key]) {
      return new Promise(
        resolve => resolve(this.unsubscribe(data, key)),
      );
    }

    const results = await Promise.all(
      entries.map(
        async ([key, data]) => await asyncFn([data,key])
        
      )
    );
    return results.every((result) => result === true);
  }