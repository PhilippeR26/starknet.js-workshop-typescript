// utils for building of Starknet.js documentation.
import { createReadStream, promises as fs } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { createInterface } from 'readline';

interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileTreeNode[];
}

interface ReversedTreeNode {
  fileName: string;
  path: string;
}

async function getFileTreeTyped(dirPath: string): Promise<FileTreeNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: FileTreeNode[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const node: FileTreeNode = {
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: fullPath
    };
    if (entry.isDirectory()) {
      node.children = await getFileTreeTyped(fullPath);
    }
    nodes.push(node);
  }
  return nodes;
}

let qtyCorrected = 0;

async function analyzeFile(file: ReversedTreeNode, reversedTree: ReversedTreeNode[], basePath: string) {
  // scan only basePath (starknet) directory
  if (file.path.startsWith(basePath)) {
     console.log("*********** file.path=", file.path);
    const dirs = file.path.split("/");
    const needle = "../index.md";
    const toReplaceLength = needle.indexOf(".md") - (needle.indexOf("/") + 1);
    // console.log({ toReplaceLength });
    let contentResult = "";
    let isFileModified: boolean = false;
    const fileStream = createReadStream(file.path, { encoding: 'utf8' });
    // console.log("stream=",fileStream);

    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (let line of rl) {
      // console.log(`Ligne: ${line}`);
      if (line.includes(needle)) {
        // console.log("---->> Found '../index.md' ", line, "\n", file.fileName, file.path);
        const positions: number[] = [0];
        let pos = 0;
        while ((pos = line.indexOf(needle, pos)) !== -1) {
          positions.push(pos);
          pos += needle.length;
        }
         console.log("positions =", positions);
        //if (positions.length > 1) {
        // console.log(">1");

        for (let i: number = positions.length - 2; i >=0; i--) {
          let base: string = line.slice(positions[i], positions[i + 1]);
          // console.log("i=", i);
          let nbBack = 0;
          while (base.endsWith("../")) {
            nbBack++;
            base = base.slice(0, base.length - "../".length);
          }
          const baseTarget = dirs.slice(0, dirs.length - nbBack - 2).join("/");
          const targetForIndex = baseTarget + "/index.md";
          const targetForName = baseTarget + "/" + dirs[dirs.length - nbBack - 3] + ".md";
          const fileIndexSet = new Set(reversedTree.map((item) => item.path));
          const isFoundWithIndex = fileIndexSet.has(targetForIndex);
           console.log("result= nbBack=", nbBack, "baseTarget=", baseTarget, "targetForIndex=", targetForIndex, "targetForName=", targetForName, "isFoundIndex=", isFoundWithIndex);
          if (!isFoundWithIndex) {
            const isFoundWithName = fileIndexSet.has(targetForName);
             console.log("isFoundName=", isFoundWithName);
            if (isFoundWithName) {
              isFileModified = true;
              qtyCorrected++;
              // console.log("before modification line=", line);
              // console.log("####new name=", dirs[dirs.length - nbBack - 3]);
              const t = line.slice(0, positions[i + 1] + 3) + dirs[dirs.length - nbBack - 3] + line.slice(positions[i + 1] + 3 + toReplaceLength);
              line = t
              // console.log("           modified line=", line);
            } else {

            }
          }
        }
        contentResult += line + "\n";
        // } else {
        //   throw new Error("Ne devrait pas se produire");
        // }
      } else {
        contentResult += line + "\n";
      }
    }
    fileStream.destroy();
    if (isFileModified) {
       console.log("==== result file\n", contentResult, "\n====");
       await writeFile(file.path, contentResult)
    }
  }
}

function extractReversedTree(nodes: FileTreeNode[]): ReversedTreeNode[] {
  const acc: ReversedTreeNode[] = [];
  let childAcc: ReversedTreeNode[] = [];
  nodes.forEach((node: FileTreeNode) => {
    if (node.type === 'directory' && node.children) {
      childAcc = extractReversedTree(node.children);
    } else {
      childAcc = [{ fileName: node.name, path: node.path }];
    }
    acc.push(...childAcc);
  }
  );
  return acc;
}

async function createReversedTree(baseScan:string):Promise<ReversedTreeNode[]> {
  const tree = await getFileTreeTyped(baseScan);
  // console.log("tree:", tree);

  // reverse tree
  // console.log("reversedTree :", reversedTree);
  return extractReversedTree(tree);
}


// Usage
async function main() {
  const baseScan = "/D/starknetFork/starknet.js/www/docs/API/";
  const baseCorrection = baseScan + "starknet";
  const reversedTree=await createReversedTree(baseScan);
  
  for (const node of reversedTree) {
    await analyzeFile(node, reversedTree, baseCorrection);
  }
  console.log(qtyCorrected, "links corrected");

  // const fileStream = createReadStream("/D/starknetFork/starknet.js/www/docs/API/starknet/namespaces/walletV5/walletV5.md", { encoding: 'utf8' });
  // // console.log("stream=",fileStream);

  // const rl = createInterface({
  //   input: fileStream,
  //   crlfDelay: Infinity
  // });

  // for await (const line of rl) {
  //   console.log(`Ligne: ${line}`);
  //   // if (line.includes('../index.md')) {
  //   //   console.log("Found '../index.md' ", line);
  //   // }
  // }

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });