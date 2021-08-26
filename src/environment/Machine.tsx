export enum Action {
    MOVE_N = 'шаг на север',
    MOVE_S = 'шаг на юг',
    MOVE_E = 'шаг на восток',
    MOVE_W = 'шаг на запад',
    PAINT = 'закрасить',
}

export enum BoolOp {
    CAN_N = 'на севере свободно',
    CAN_S = 'на юге свободно',
    CAN_E = 'на востоке свободно',
    CAN_W = 'на западе свободно',
    PAINTED = 'закрашено',
    OR = 'или',
    AND = 'и',
    NOT = 'не',
}

export const BoolOp_arity = (op: BoolOp) => {
    if (op === BoolOp.NOT) {
        return 1;
    }
    if (op === BoolOp.AND || op === BoolOp.OR) {
        return 2;
    }
    return 0;
};
