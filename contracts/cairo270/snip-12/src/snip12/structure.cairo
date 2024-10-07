pub trait IStructHash<T> {
    fn hash_struct(self: @T) -> felt252;
}

