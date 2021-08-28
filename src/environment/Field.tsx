import { observable, action } from 'mobx';

function newMatrix<Type>(x: number, y: number, val: Type): Type[][] {
    const mat = new Array<Type[]>(x)
    for (let ix = 0; ix < x; ix++) {
        mat[ix] = new Array<Type>(y)
        for (let iy = 0; iy < y; iy++) {
            mat[ix][iy] = val
        }
    }
    return mat
}

export class Field {
    // (x, y) coordinates start at (0, 0) in the north-west corner of the field; 
    // x axis goes to the east, y axis goes to the south
    @observable painted: boolean[][]  // pained[x][y] === true iff (x, y) is painted
    @observable vwalls: boolean[][]   // vwalls[x][y] === true iff (x, y) has a wall on the east
    @observable hwalls: boolean[][]   // hwalls[x][y] === true iff (x, y) has a wall on the south

    @observable xsize: number
    @observable ysize: number

    constructor() {
        this.xsize = 0
        this.ysize = 0
        this.painted = []
        this.vwalls = []
        this.hwalls = []
        this.setSize(10, 11)
    }

    @action.bound
    setSize(x: number, y: number) {
        const newpainted = newMatrix<boolean>(x, y, false)
        const newhv = newMatrix<boolean>(x, y - 1, false)
        const newvv = newMatrix<boolean>(x - 1, y, false)

        for (let ix = 0; ix < x; ix++) {
            for (let iy = 0; iy < y; iy++) {
                if (ix < this.xsize && iy < this.ysize) {
                    newpainted[ix][iy] = this.painted[ix][iy]
                }
                if (ix < this.xsize && iy < this.ysize - 1 && iy < y - 1) {
                    newhv[ix][iy] = this.hwalls[ix][iy]
                }
                if (ix < this.xsize - 1 && iy < this.ysize && ix < x - 1) {
                    newvv[ix][iy] = this.vwalls[ix][iy]
                }
            }
        }

        this.xsize = x
        this.ysize = y
        this.painted = newpainted
        this.vwalls = newvv
        this.hwalls = newhv
    }

    canE(x: number, y: number): boolean {
        if (x >= this.xsize - 1 || x < 0 || y >= this.ysize || y < 0) return false
        return !this.vwalls[x][y]
    }

    canW(x: number, y: number): boolean {
        if (x >= this.xsize || x < 1 || y >= this.ysize || y < 0) return false
        return !this.vwalls[x - 1][y]
    }

    canS(x: number, y: number): boolean {
        if (x >= this.xsize || x < 0 || y >= this.ysize - 1 || y < 0) return false
        return !this.hwalls[x][y]
    }

    canN(x: number, y: number): boolean {
        if (x >= this.xsize || x < 0 || y >= this.ysize || y < 1) return false
        return !this.hwalls[x][y - 1]
    }

    knot(x: number, y: number): boolean {
        if (!this.canE(x - 1, y - 1)) return true
        if (!this.canS(x, y - 1)) return true
        if (!this.canW(x, y)) return true
        if (!this.canN(x - 1, y)) return true
        return false
    }

    @action
    clone(): Field {
        let f = new Field()
        f.setSize(this.xsize, this.ysize)

        for (let ix = 0; ix < this.xsize; ix++) {
            for (let iy = 0; iy < this.ysize; iy++) {
                f.painted[ix][iy] = this.painted[ix][iy]
                if (iy < this.ysize - 1) {
                    f.hwalls[ix][iy] = this.hwalls[ix][iy]
                }
                if (ix < this.xsize - 1) {
                    f.vwalls[ix][iy] = this.vwalls[ix][iy]
                }
            }
        }
        return f
    }

    @action.bound
    setWallE(x: number, y: number, wall: boolean) {
        if (x >= this.xsize - 1 || x < 0 || y >= this.ysize || y < 0) return
        this.vwalls[x][y] = wall
    }

    @action.bound
    setWallW(x: number, y: number, wall: boolean) {
        if (x >= this.xsize || x < 1 || y >= this.ysize || y < 0) return
        this.vwalls[x - 1][y] = wall
    }

    @action.bound
    setWallS(x: number, y: number, wall: boolean) {
        if (x >= this.xsize || x < 0 || y >= this.ysize - 1 || y < 0) return
        this.hwalls[x][y] = wall
    }

    @action.bound
    setWallN(x: number, y: number, wall: boolean) {
        if (x >= this.xsize || x < 0 || y >= this.ysize || y < 1) return
        this.hwalls[x][y - 1] = wall
    }

    @action.bound
    setPainted(x: number, y: number, painted: boolean) {
        if (x < 0 || x >= this.xsize || y < 0 || y >= this.ysize) return
        this.painted[x][y] = painted
    }
}