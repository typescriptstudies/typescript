namespace BoardUtils {

export function setFromRawFen(fen:string){
    for(let i=0;i<this.cfg.area;i++){
        let index = i*2
        let kind = fen[index]
        let color = +fen[index+1]
        this.state.rep[i]=new Piece(kind,color)
    }
}

export function whereIsKing(color:number=this.state.turn):Square{
    let testking=new Piece("k",color)
    for(let i=0;i<this.cfg.area;i++){
        if(this.state.rep[i].equalto(testking)) return this.squareOfIndex(i)
    }
    return null
}

export function getEffectivePawnDirection(pd:Square,dc:number):Square{
    let epd=new Square(pd.file,pd.rank)
    if(pd.file==0){epd.file=dc}
    else if(pd.rank==0){epd.rank=dc}
    return epd
}

export function isPieceAttackedAtSquare(p:Piece,sq:Square):boolean{
    if(p.kind=="p"){            
        for(let col=0;col<this.cfg.numPlayers;col++)if(col!=p.color){
            let pd=this.cfg.pawnDirectionsByColor[col]
            for(let dc=-1;dc<=1;dc+=2){
                let epd=this.getEffectivePawnDirection(pd,dc)
                let tsq=sq.Minus(epd)
                if(this.isSquareValid(tsq)){                        
                    let p=this.getPieceAtSquare(tsq)
                    if((p.kind=="p")&&(p.color==col)) return true
                }
            }
        }
    } else {
        let [moves,capture]=this.pseudoLegalMovesForPieceAtSquare(p,sq,true,p.kind)
        if(capture) return true
    }
    return false
}

export function isSquareAttacked(sq:Square,color:number=this.state.turn):boolean{
    let kinds=this.cfg.allPieces
    for(let i in kinds){
        let testpiece=new Piece(kinds[i],color)
        if(this.isPieceAttackedAtSquare(testpiece,sq)) return true
    }
    return false
}

export function isColorInCheck(color:number=this.state.turn):boolean{
    let wk=this.whereIsKing(color)
    if(wk==null) return true
    return this.isSquareAttacked(wk,color)
}

export function squareOfIndex(i:number):Square{
    let f=(i%this.cfg.numFiles)
    let r=Math.floor(i/this.cfg.numFiles)
    return new Square(f,r)
}

export function squareHasPieceOfColor(sq:Square,color:number,exclude:boolean=false){
    if(!this.isSquareValid(sq)) return false
    let p=this.getPieceAtSquare(sq)
    if(p.empty()) return false
    if(exclude) return p.color!=color
    return p.color==color
}

export function rotateSquare(sq:Square,rot:number):Square{
    if(rot == 0) {return sq}
    if(rot < 0) {rot = 4 + rot}
    if(rot == 1) {return new Square(this.cfg.lastRank - sq.rank,sq.file)}
    if(rot == 2) {return new Square(this.cfg.lastFile - sq.file,this.cfg.lastRank - sq.rank)}
    return new Square(sq.rank,this.cfg.lastFile - sq.file)
}

export function squareToAlgeb(sq:Square):string{
    let fl=Utils.FILE_TO_FILE_LETTER[sq.file]
    let rl=""+(this.cfg.numRanks - sq.rank)
    return fl + rl
}

export function fileLetterToFile(fl:string){
    return Utils.FILE_LETTER_TO_FILE[fl]
}

export function rankLetterToRank(b:Board,rl:string){
    return (b.cfg.numRanks - parseInt(rl))
}

export function algebToSquare(algeb:string):Square{        
    let t=new Utils.Tokenizer(algeb)
    let fl=t.pull(Utils.FILE_LETTER)
    let rl=t.pull(Utils.RANK_LETTER)
    let f=fileLetterToFile(fl)
    let r=rankLetterToRank(this,rl)
    return new Square(f,r)
}

export function algebToMove(algeb:string):Move{
    let t=new Utils.Tokenizer(algeb)
    let fromalgeb=t.pull(Utils.FILE_LETTER)+t.pull(Utils.RANK_LETTER)
    let toalgeb=t.pull(Utils.FILE_LETTER)+t.pull(Utils.RANK_LETTER)
    let promalgeb=t.pull(this.cfg.promotionPieces)
    let fromsq=this.algebToSquare(fromalgeb)
    let tosq=this.algebToSquare(toalgeb)
    if(promalgeb=="") return new Move(fromsq,tosq)        
    return new Move(fromsq,tosq,new Piece(promalgeb,this.state.turn))
}

export function moveToAlgeb(m:Move,info:boolean=false):string{
    let algeb=this.squareToAlgeb(m.fromsq)+this.squareToAlgeb(m.tosq)
    if(!m.prom.empty()){
        algeb+=m.prom.kind
    }
    if(info){
        let infostr=m.info()
        if(infostr!="") algeb+=" "+infostr
    }
    return algeb
}

export function isSquareValid(sq:Square):boolean{
    if(this.IS_FOUR_PLAYER()){
        if((sq.file<3)&&(sq.rank<3)) return false
        if((sq.file<3)&&(sq.rank>10)) return false
        if((sq.file>10)&&(sq.rank>10)) return false
        if((sq.file>10)&&(sq.rank<3)) return false
    }
    if((sq.file<0)||(sq.file>this.cfg.lastFile)) return false
    if((sq.rank<0)||(sq.rank>this.cfg.lastRank)) return false
    return true
}

export function toNode(gn:GameNode,incremental:boolean=false){    
    incremental=false
    if(!incremental){
        this.current=gn        
        this.setFromFen(gn.fen)
    } else {
        let algebs:string[]=[]
        while(gn.parent!=null){
            algebs.push(gn.genalgeb)
            gn=gn.parent
        }
        algebs.reverse()
        this.setFromFen(this.startfen)
        this.current=this.root
        for(let ai in algebs){
            let algeb=algebs[ai]
            let m=this.algebToMove(algeb)
            let rm=this.toRichMove(m)
            this.makeMove(rm)
        }
    }
}

export function toBegin(){
    this.toNode(this.root)
}

export function back(){
    if(this.current.parent!=null){
        this.toNode(this.current.parent)            
    }
}

export function forward(){
    if(this.current.haschild()){
        this.toNode(this.current.mainchild())
    }
}    

export function toEnd(){
    while(this.current.haschild()){
        this.current=this.current.mainchild()
    }
    this.toNode(this.current)
}

}