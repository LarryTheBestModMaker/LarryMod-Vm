/**
 * Types of block shapes
 * @enum {number}
 */
const BlockShape = {
    /**
     * Output shape: hexagonal (booleans/predicates).
     */
    HEXAGONAL: 1,

    /**
     * Output shape: rounded (numbers/strings).
     */
    ROUND: 2,

    /**
     * Output shape: squared (arrays).
     */
    SQUARE: 3,

    /**
     * Output shape: leaf-ed (vectors).
     */
    LEAF: 4,

    /**
     * Output shape: plus (objects/classes or class instances).
     */
    PLUS: 5,
};

module.exports = BlockShape;
