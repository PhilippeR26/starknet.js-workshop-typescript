

pub fn convert_b31_to_f252(inp: Array<bytes31>) -> Span<felt252> {
    let mut res: Array<felt252> = array![];
    for i in inp {
        res.append(i.into());
    };
    res.span()
}

pub fn pack(value: bytes31) -> felt252 {
    value.into()
}
