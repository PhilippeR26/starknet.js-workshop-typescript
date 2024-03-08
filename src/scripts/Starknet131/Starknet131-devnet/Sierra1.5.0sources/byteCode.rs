fn bytecode_hash_node(
    iter: &mut impl Iterator<Item = FieldElement>,
    node: &NestedIntList,
) -> (usize, FieldElement) {
    match node {
        NestedIntList::Leaf(len) => {
            let data = &iter.take(*len).collect_vec();
            assert_eq!(data.len(), *len);
            (*len, poseidon_hash_many(data))
        }
        NestedIntList::Node(nodes) => {
            // Compute `1 + poseidon(len0, hash0, len1, hash1, ...)`.
            let inner_nodes = nodes.iter().map(|node| bytecode_hash_node(iter, node)).collect_vec();
            let hash = poseidon_hash_many(
                &inner_nodes.iter().flat_map(|(len, hash)| [(*len).into(), *hash]).collect_vec(),
            ) + 1u32.into();
            (inner_nodes.iter().map(|(len, _)| len).sum(), hash)
        }
    }
}