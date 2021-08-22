import { observable, action, computed } from 'mobx';

function newMatrix<Type>(x: number, y: number, val: Type): Type[][] {
    const mat = new Array<Type[]>(x)
    mat.forEach((_, i) => {
        mat[i] = new Array<Type>(y)
        mat[i].forEach((_, j) => {
            mat[i][j] = val
        });
    })
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
        this.setSize(10, 10)
    }

    @action.bound
    setSize(x: number, y: number) {
        const newpainted = newMatrix<boolean>(x, y, false)
        const newhv = newMatrix<boolean>(x, y-1, false)
        const newvv = newMatrix<boolean>(x-1, y, false)

        for (let ix = 0; ix < x; ix++) {
            for (let iy = 0; iy < y; iy++) {
                if (ix < this.xsize && iy < this.ysize) {
                    newpainted[ix][iy] = this.painted[ix][iy]
                }
                if (ix < this.xsize && iy < this.ysize-1 && iy < y-1) {
                    newhv[ix][iy] = this.hwalls[ix][iy]
                }
                if (ix < this.xsize-1 && iy < this.ysize && ix < x-1) {
                    newvv[ix][iy] = this.vwalls[ix][iy]
                }
            }
        }

        this.xsize = x
        this.ysize = y
    }

    canE(x: number, y: number): boolean {
        if (x >= this.xsize-1 || x < 0 || y >= this.ysize || y < 0) return false
        return !this.hwalls[x][y]
    }

    canW(x: number, y: number): boolean {
        if (x >= this.xsize || x < 1 || y >= this.ysize || y < 0) return false
        return !this.hwalls[x-1][y]
    }

    canS(x: number, y: number): boolean {
        if (x >= this.xsize || x < 0 || y >= this.ysize-1 || y < 0) return false
        return !this.vwalls[x][y]
    }

    canN(x: number, y: number): boolean {
        if (x >= this.xsize || x < 0 || y >= this.ysize || y < 1) return false
        return !this.hwalls[x][y-1]
    }

    @action.bound
    setWallE(x: number, y: number, wall: boolean) {
        if (x >= this.xsize-1 || x < 0 || y >= this.ysize || y < 0) return
        this.hwalls[x][y] = wall
    }

    @action.bound
    setWallW(x: number, y: number, wall: boolean) {
        if (x >= this.xsize || x < 1 || y >= this.ysize || y < 0) return
        this.hwalls[x-1][y] = wall
    }

    @action.bound
    setWallS(x: number, y: number, wall: boolean) {
        if (x >= this.xsize || x < 0 || y >= this.ysize-1 || y < 0) return
        this.vwalls[x][y] = wall
    }

    @action.bound
    setWallN(x: number, y: number, wall: boolean) {
        if (x >= this.xsize || x < 0 || y >= this.ysize || y < 1) return
        this.hwalls[x][y-1] = wall
    }
}