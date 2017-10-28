class Piece {

    kind:string
    color:number

    algeb():string{
        return this.kind+this.color
    }

    empty():boolean{
        return this.kind=="-"
    }

    equalto(p:Piece):boolean{
        return ( ( this.kind == p.kind ) && ( this.color == p.color ) )
    }

    constructor(_kind:string="-",_color:number=0){this.kind=_kind;this.color=_color}    
}

class Square {

    file:number
    rank:number    

    constructor(_file:number,_rank:number){this.file=_file;this.rank=_rank}

    Plus(sq:Square):Square{
        return new Square(this.file + sq.file,this.rank + sq.rank)
    }

    Minus(sq:Square):Square{
        return new Square(this.file - sq.file,this.rank - sq.rank)
    }

    Normalize():Square{
        if(this.file==0)return new Square(0,this.rank>0?1:-1)
        if(this.rank==0)return new Square(this.file>0?1:-1,0)
        return null
    }

    Rotate(rot:number):Square{
        switch(rot){
            case 1: return new Square(this.rank,-this.file)
            case -1: return new Square(-this.rank,this.file)
        }
    }

    isRoughlyEqualTo(sq:Square):boolean{
        if(sq.file==null){
            if(sq.rank==null) return true
            else return this.rank==sq.rank
        } else {
            if(sq.rank==null) return this.file==sq.file
            else return this.isEqualTo(sq)
        }
    }

    isEqualTo(sq:Square):boolean{
        return ( ( this.file == sq.file ) && ( this.rank == sq.rank ) )
    }

}

class TreeNode {

    moves:{[id:string]:TreeNode}
    current:boolean

    constructor(){
        this.moves={}
    }

}

class GameNode {

    fen:string
    genalgeb:string
    gensan:string
    childs:{string:GameNode}
    parent:GameNode
    fullmove_number:number
    turn:number

    has(algeb):boolean{
        let c=this.childs[algeb]        
        return ((c!=undefined)&&(c!=null))
    }

    algebs():string[]{
        return Object.keys(this.childs)
    }

    haschild():boolean{
        return ( this.algebs().length > 0 )
    }

    mainchild():GameNode{
        let mainalgeb=this.algebs()[0]
        return this.childs[mainalgeb]
    }

    constructor(){
        this.childs=<{string:GameNode}>{}
        this.genalgeb=""
        this.gensan=""
        this.fen=""
        this.parent=null
        this.fullmove_number=1
        this.turn=1
    }

    reportTreeNode(current:GameNode):TreeNode{
        let tn=new TreeNode()        
        for(let gni in this.childs){
            let gn=this.childs[gni]
            tn.moves[gn.gensan]=gn.reportTreeNode(current)
            if(gn==current) tn.moves[gn.gensan].current=true
        }
        return tn
    }

}

class Pgn {
    variant:string
    headers:{[id:string]:string}
    tree:TreeNode
}

class Move {

    fromsq:Square
    tosq:Square
    prom:Piece

    epsq:EpSquare
    epclsq:Square

    promotion:boolean=false    
    capture:boolean=false
    pawnmove:boolean=false
    pawnpushby:number=0
    castling:boolean=false
    epcapture:boolean=false
    
    constructor(_fromsq:Square,_tosq:Square,_prom:Piece=new Piece()){
        this.fromsq=_fromsq
        this.tosq=_tosq
        this.prom=_prom
        if(!_prom.empty()) this.promotion=true
    }

    Capture():Move{
        this.capture=true
        return this
    }

    PawnPush(by:number):Move{
        this.pawnpushby=by
        this.pawnmove=true
        return this
    }

    PawnCapture():Move{
        this.capture=true
        this.pawnmove=true
        return this
    }

    Castling():Move{
        this.castling=true
        return this
    }

    EpSquare(_epsq:EpSquare):Move{
        this.epsq=_epsq
        return this
    }

    EpClearSquare(_epclsq:Square):Move{
        this.epclsq=_epclsq
        this.epcapture=true        
        return this.PawnCapture()
    }

    isRoughlyEqualTo(m:Move){
        let fe=(m.fromsq!=null)?this.fromsq.isEqualTo(m.fromsq):true
        let te=(m.tosq!=null)?this.tosq.isEqualTo(m.tosq):true
        return ( fe && te )
    }

    isEqualTo(m:Move){
        return ( (this.isRoughlyEqualTo(m)) && (this.prom.kind==m.prom.kind) )
    }

    info():string{
        let info=""
        if(this.capture) info+="x"
        if(this.castling) info+="c"
        if(this.promotion) info+="="+this.prom.kind
        if(this.pawnmove) info+="p"
        if(this.pawnpushby>0) info+=this.pawnpushby
        if(this.epsq!=undefined) info+="(e"+this.epsq.sq.file+","+this.epsq.sq.rank+")"
        if(this.epcapture) info+="epx"+this.epclsq.file+","+this.epclsq.rank
        return info
    }

}

class EpSquare{
    sq:Square
    clsq:Square
    cnt:number
    color:number
    constructor(_sq:Square,_clsq:Square,_cnt:number,_color:number){
        this.sq=_sq
        this.clsq=_clsq
        this.cnt=_cnt
        this.color=_color
    }    
    isEqualToSq(_sq:Square):boolean{
        return this.sq.isEqualTo(_sq)
    }
    canDecrease():boolean{
        this.cnt--
        return ( this.cnt >= 0 )
    }
}

class GeneralBoardState{
    ////////////////////////////////////
    // requires special treatment

    rawfen:string
    rep:Piece[]
    
    ////////////////////////////////////
    // all other fields

    turn:number
    castlingRights:boolean[][]    
    epSquares:EpSquare[]
    fullmove_number:number
    halfmove_clock:number

    ////////////////////////////////////    
}

class BoardState extends GeneralBoardState{

    update(rbs:ReportableBoardState){
        this.turn=rbs.turn
        this.castlingRights=rbs.castlingRights
        this.epSquares=rbs.epSquares
        this.fullmove_number=rbs.fullmove_number
        this.halfmove_clock=rbs.halfmove_clock
    }

    getEpSquare(ei:number):EpSquare{
        let esq=this.epSquares[ei]
        return new EpSquare(
            new Square(esq.sq.file,esq.sq.rank),
            new Square(esq.clsq.file,esq.clsq.rank),
            esq.cnt,
            esq.color
        )
    }

    setEpSquare(ei:number,epsq:EpSquare){
        this.epSquares[ei]=epsq
    }

    pushEpSquare(epsq){
        this.epSquares.push(epsq)
    }

    getNumEpSquares():number{
        if(this.epSquares==undefined) return 0
        return this.epSquares.length
    }

    setEpSquares(epsqs:EpSquare[]){
        this.epSquares=epsqs
    }
    
}

class ReportableBoardState extends GeneralBoardState{

    constructor(_rawfen:string,boardstate:BoardState){
        super()
        this.rawfen=_rawfen
        this.turn=boardstate.turn
        this.castlingRights=boardstate.castlingRights
        this.epSquares=boardstate.epSquares
        this.fullmove_number=boardstate.fullmove_number
        this.halfmove_clock=boardstate.halfmove_clock
    }

}

class CastlingRegistry{
    kingSquare:Square
    rookSquare:Square
    emptySquares:Square[]
    passingSquares:Square[]

    constructor(_kingSquare:Square,_rookSquare:Square,_emptySquares:Square[],_passingSquares:Square[]){
        this.kingSquare=_kingSquare
        this.rookSquare=_rookSquare
        this.emptySquares=_emptySquares
        this.passingSquares=_passingSquares
    }
}