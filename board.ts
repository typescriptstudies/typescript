/////////////////////////////////////////////////////////////////////////

import ScreenVector = Utils.ScreenVector
import doc = Node_Globals.doc

/////////////////////////////////////////////////////////////////////////

class EngineMessage{
    action:string
    name:string
    command:string
    buffer:string
    available:string[]
    _action(_action):EngineMessage{this.action=_action;return this}    
    _command(_command):EngineMessage{this.command=_command;return this}    
    _name(_name):EngineMessage{this.name=_name;return this}    
    parseJson(data:string):EngineMessage{
        let pd=JSON.parse(data)
        this.action=pd.action
        this.available=pd.available
        this.buffer=pd.buffer
        return this
    }
}

class Board {    
    /////////////////////////////////////////////////////////////////////////

    cfg:Config.ChessConfiguration

    /////////////////////////////////////////////////////////////////////////

    variant:string="standard"

    anchorid:string=""

    purpose:string="test"

    wb:wBoard

    /////////////////////////////////////////////////////////////////////////

    static DEFAULT_VARIANT = "standard"
    static DEFAULT_BOARD_SIZE = 400.0
    static PIECE_OPACITIES = [1.0,1.0,1.0,1.0]
	static PIECE_FILL_COLORS = ["#000000","#ffffff","#ffff00","#ff0000"]
    static PIECE_STROKE_COLORS = ["#ffffff","#dfdfdf","#afafaf","#afafaf"]
    static SQUARE_OPACITY = 0.2
    static DARK_SQUARE_COLOR = "#8f8f8f"
    static LIGHT_SQUARE_COLOR = "#dfdfdf"
    static CONTAINER_Z_INDEX = 10
    static BACKGROUND_Z_INDEX = 50
    static SQUARE_Z_INDEX = 100
    static ARROW_Z_INDEX = 150
    static PIECE_Z_INDEX = 200
    static DRAGGED_PIECE_Z_INDEX = 500
    static POS_EVAL_MOVE_COL = "#00ff00"
    static NEG_EVAL_MOVE_COL = "#ff0000"
    static ENGINE_DEPTH_COL = "#0000ff"

    /////////////////////////////////////////////////////////////////////////

    SQUARE_SIZE:number
    HALF_SQUARE_SIZE:number
    HALF_SQUARE_SIZE_SCREENVECTOR:ScreenVector
    SQUARE_PADDING:number
    PIECE_SIZE:number
    BOARD_MARGIN:number

    /////////////////////////////////////////////////////////////////////////
    // field describing the board state
    
    state:BoardState

    /////////////////////////////////////////////////////////////////////////

    castlingRegistries:CastlingRegistry[][]

    /////////////////////////////////////////////////////////////////////////

    flip:number

    /////////////////////////////////////////////////////////////////////////
    
    startfen:string   

    /////////////////////////////////////////////////////////////////////////
    
    dragstart:ScreenVector
	dragstartst:ScreenVector
    dragd:ScreenVector	
    dragunderway:boolean
    draggedid:string	
    pids:string[]    
    dragz:number

    /////////////////////////////////////////////////////////////////////////

    root:GameNode
    current:GameNode

    pgnHeaders:{[id:string]:string}

    /////////////////////////////////////////////////////////////////////////

    tabs:TabPane_
    saninput:Text_
    pgnkeyinput:Text_
    pgnvalueinput:Text_
    rootnode:Div_
    presdiv:Div_
    wlogdiv:Div_
    fentext:Textarea_
    enginearrow:Div_
    depthdiv:Div_
    scorediv:Div_

    /////////////////////////////////////////////////////////////////////////

    randomon:boolean

    /////////////////////////////////////////////////////////////////////////

    constructor(){        
    }

    Variant(_variant:string):Board{this.variant=_variant;return this}

    AnchorId(_anchorId:string):Board{this.anchorid=_anchorId;return this}

    Main():Board{this.purpose="main";return this}

    wConstruct(callback:(b:Board)=>void){
        this.wb=new wBoard(this.Construct.bind(this,callback))
    }

    Construct(callback:(b:Board)=>void=null):Board{

        if(this.variant==undefined) this.variant=Board.DEFAULT_VARIANT

        if(this.anchorid==undefined) this.anchorid=""

        if(this.purpose==undefined) this.purpose="test"

        this.cfg=Config.chessConfigurationManager.getConfigurationByVariantId(this.variant)        

        /////////////////////////////////////////////////////////////////////////
        // initialize board state once by hand in order to establish the start fen

        if(this.HAS_WASM()){
            this.wb.newBoard(this.variantCode())
        }

        this.state=new BoardState()

        this.state.rep=new Array(this.cfg.area)                        
        this.state.turn=1

        this.setFromRawFen(this.cfg.startRawFen)

        this.createCastlingRegistries()

        this.state.setEpSquares([])

        this.state.fullmove_number=1
        this.state.halfmove_clock=0
        
        /////////////////////////////////////////////////////////////////////////
        // calculate start fen
        
        this.startfen=this.reportFen()        

        /////////////////////////////////////////////////////////////////////////
        // initialize game

        this.root=new GameNode()
        this.root.fen=this.startfen
        this.current=this.root                

        this.setDefaultPgnHeaders()

        /////////////////////////////////////////////////////////////////////////

        this.SQUARE_SIZE= ( Board.DEFAULT_BOARD_SIZE / this.cfg.numRanks )
        this.SQUARE_PADDING= ( this.SQUARE_SIZE / 10.0 )
        this.PIECE_SIZE= ( this.SQUARE_SIZE - 2 * this.SQUARE_PADDING )
        this.HALF_SQUARE_SIZE= ( this.SQUARE_SIZE / 2.0 )
        this.HALF_SQUARE_SIZE_SCREENVECTOR = new ScreenVector(this.HALF_SQUARE_SIZE,this.HALF_SQUARE_SIZE)
        this.BOARD_MARGIN = ( Board.DEFAULT_BOARD_SIZE / 50.0 )

        // when called for variant change, preserve flip
        if(this.flip==undefined){this.flip = 0}                        

        this.randomon=false

        /////////////////////////////////////////////////////////////////////////

        if(callback!=null) callback(this)

        /////////////////////////////////////////////////////////////////////////

        return this

    }

    reset(){                
        this.setFromFen(this.startfen)        

        this.setDefaultPgnHeaders()

        this.root=new GameNode()
        this.root.fen=this.reportFen()
        this.current=this.root                

        this.randomon=false
    }    

    setFromStandardFen(fen:string){
        let parts=fen.split(" ")
        let rawfen=parts[0]
        let turnfen=parts[1]
        let castlefen=parts[2]
        let epfen=parts[3]
        let halfmovefen=parts[4]
        let fullmovefen=parts[5]

        let rawfenchars=rawfen.split("")
        let i=0
        for(let ri in rawfenchars){            
            let c=rawfenchars[ri]
            if(c!="/"){
                let n=parseInt(c)                                
                if(!isNaN(n)){                                        
                    while(n>0){
                        this.state.rep[i]=new Piece()
                        n--
                        i++
                    }
                } else {                    
                    let kind=c
                    let color=0
                    if(c==c.toUpperCase()){
                        kind=c.toLowerCase()
                        color=1
                    }
                    let p=new Piece(kind,color)    
                    this.state.rep[i]=p                    
                    i++
                }
            }
        }

        this.state.turn=(turnfen=="w"?1:0)

        this.state.castlingRights=[[false,false],[false,false]]

        let castlechars=castlefen.split("")
        for(let ci in castlechars){
            let c=castlechars[ci]
            switch(c){
                case "K":this.state.castlingRights[1][1]=true;break
                case "Q":this.state.castlingRights[1][0]=true;break
                case "k":this.state.castlingRights[0][0]=true;break
                case "q":this.state.castlingRights[0][1]=true;break
            }
        }

        this.state.epSquares=[]

        if(epfen!="-"){
            let sq=this.algebToSquare(epfen)
            let pdir=this.cfg.pawnDirectionsByColor[1-this.state.turn]
            let clsq=sq.Plus(pdir)
            let epsq=new EpSquare(sq,clsq,0,1-this.state.turn)
            this.state.epSquares.push(epsq)            
        }

        this.state.halfmove_clock=parseInt(halfmovefen)

        this.state.fullmove_number=parseInt(fullmovefen)

        if(this.HAS_WASM()){
            this.setWBoard()
        }
    }

    setWBoard(){
        this.wb.setFromRawFen(this.reportRawFen())
        this.wb.setTurn(this.state.turn);
        this.wb.setFullmoveNumber(this.state.fullmove_number)
        this.wb.setHalfmoveClock(this.state.halfmove_clock)
        
        this.wb.resetEpSquares()

        for(let ei in this.state.epSquares){
            let epsq=this.state.epSquares[ei]
            this.wb.setEpSquare(
                epsq.color,
                epsq.sq.file,
                epsq.sq.rank,
                epsq.clsq.file,
                epsq.clsq.rank,
                epsq.cnt
            )
        }

        this.wb.resetCastlingRegistries()

        for(let ci=0;ci<this.cfg.numPlayers;ci++)
        for(let cs=0;cs<2;cs++){
            let right=this.state.castlingRights[ci][cs]
            let cr=this.castlingRegistries[ci][cs]
            this.wb.setCastlingRegistry(
                ci,
                cs,
                right?1:0,
                cr.kingSquare.file,
                cr.kingSquare.rank,
                cr.rookSquare.file,
                cr.rookSquare.rank
            )
            for(let ei=0;ei<cr.emptySquares.length;ei++){
                this.wb.setCastlingRegistryEmpty(
                    ci,
                    cs,
                    ei,
                    cr.emptySquares[ei].file,
                    cr.emptySquares[ei].rank
                )                
            }
            for(let pi=0;pi<cr.passingSquares.length;pi++){
                this.wb.setCastlingRegistryPassing(
                    ci,
                    cs,
                    pi,
                    cr.passingSquares[pi].file,
                    cr.passingSquares[pi].rank
                )                
            }
        }        
    }

    setFromFen(fen:string){       
        if(this.cfg.standardReportable){
            this.setFromStandardFen(fen)
            return
        }

        let rbs:ReportableBoardState=JSON.parse(fen)

        this.setFromRawFen(rbs.rawfen)

        this.state.update(rbs)

        if(this.HAS_WASM()){
            this.setWBoard()
        }
    }

    reportRawFen():string{
        let buffer=""
        for(let i=0;i<this.cfg.area;i++) buffer+=this.state.rep[i].algeb()
        return buffer
    }

    reportStandardFen():string{
        let fen=""

        let cumul=0        
        for(let i=0;i<this.cfg.area;i++){
            let col=(i%8)
            let sep=(i<this.cfg.area-1?"/":"")
            let p=this.state.rep[i]            
            if(p.empty()){
                cumul++                
                if(col==7){                   
                    fen+=cumul+sep
                    cumul=0
                }
            } else {
                if(cumul>0) fen+=cumul
                cumul=0                
                let epkind=(p.color==0)?p.kind:p.kind.toUpperCase()
                if(col==7){
                    fen+=epkind+sep
                } else {
                    fen+=epkind
                }
            }
        }

        fen+=" "+(this.state.turn==1?"w":"b")+" "

        let crs=this.state.castlingRights

        let castlefen=""

        if(crs[1][1]) castlefen+="K"
        if(crs[1][0]) castlefen+="Q"
        if(crs[0][0]) castlefen+="k"
        if(crs[0][1]) castlefen+="q"

        if(castlefen=="") castlefen="-"

        fen+=castlefen

        if(this.state.epSquares.length>0){
            fen+=" "+this.squareToAlgeb(this.state.epSquares[0].sq)
        } else fen+=" -"

        fen+=" "+this.state.halfmove_clock+" "+this.state.fullmove_number

        return fen
    }

    reportFen():string{        
        if(this.cfg.standardReportable) return this.reportStandardFen()

        let rbs=new ReportableBoardState(this.reportRawFen(),this.state)

        return JSON.stringify(rbs)
    }
    
    makeMove(m:Move,updategame:boolean=true){

        if(this.HAS_WASM()){
            this.wb.makeMove(m)
        }

        let algeb=this.moveToAlgeb(m)                
        let san=updategame?this.moveToSan(m):null

        let turn=this.state.turn

        let frompiece=this.getPieceAtSquare(m.fromsq)
        let topiece=this.getPieceAtSquare(m.tosq)

        // clear original square
        this.setPieceAtSquare(m.fromsq,new Piece())

        if(m.castling){
            // clear rook square
            this.setPieceAtSquare(m.tosq,new Piece())
            let dir=m.tosq.Minus(m.fromsq).Normalize()
            // determine destination squares
            let kingdestsq=m.fromsq.Plus(dir).Plus(dir)
            let rookdestsq=kingdestsq.Minus(dir)
            // put king and rook
            this.setPieceAtSquare(kingdestsq,new Piece("k",turn))
            this.setPieceAtSquare(rookdestsq,new Piece("r",turn))
        } else {
            // determine destination piece
            let destpiece=frompiece

            if(!m.prom.empty()){
                destpiece=m.prom
            }

            // put piece on destination square
            this.setPieceAtSquare(m.tosq,destpiece)
        }

        // ep clear square
        if(m.epclsq!=undefined){
            this.setPieceAtSquare(m.epclsq,new Piece())
            for(let ei=0;ei<this.state.getNumEpSquares();ei++){
                let esq=this.state.getEpSquare(ei)
                if(esq.isEqualToSq(m.epclsq)){
                    esq.cnt=0
                    this.state.setEpSquare(ei,esq)
                }
            }
        }

        // update ep squares
        if(m.epsq!=undefined){            
            this.state.pushEpSquare(m.epsq)            
        }

        let newepsqs:EpSquare[]=[]
        for(let ei=0;ei<this.state.getNumEpSquares();ei++){
            let esq=this.state.getEpSquare(ei)
            if(esq.canDecrease()) newepsqs.push(esq)
        }

        this.state.setEpSquares(newepsqs)

        // handle atomic explosions        
        if(this.IS_ATOMIC()) if(m.capture){            
            for(let f=-1;f<=1;f++) for(let r=-1;r<=1;r++){
                let sq=m.tosq.Plus(new Square(f,r))                
                if(this.isSquareValid(sq)){
                    let testp=this.getPieceAtSquare(sq)
                    if(!testp.empty()){
                        if(testp.kind!="p"){
                            this.setPieceAtSquare(sq,new Piece())
                        }
                    }
                }
            }
        }

        // check if move cancels castling rights        
        for(let ci=0;ci<this.cfg.numPlayers;ci++)
        for(let side=0;side<=1;side++) if(this.state.castlingRights[ci][side]){            
            let ksq=this.castlingRegistries[ci][side].kingSquare
            let rsq=this.castlingRegistries[ci][side].rookSquare
            let testk=this.getPieceAtSquare(ksq)
            let testr=this.getPieceAtSquare(rsq)
            if(
                (testk.kind!='k') ||
                (testk.color!=ci) ||
                (testr.kind!='r') ||
                (testr.color!=ci)
            )
            this.state.castlingRights[ci][side]=false
        }

        // advance turn
        this.advanceTurn()

        // advance halfmove clock
        this.state.halfmove_clock++
        if(m.capture||m.pawnmove) this.state.halfmove_clock=0

        // advance fullmove number
        if(this.state.turn==1) this.state.fullmove_number++

        if(updategame){
            this.current.childs=<{string:GameNode}>{}
            // update game                                
            if(!this.current.has(san)){
                let gn=new GameNode()
                gn.fen=this.reportFen()
                gn.genalgeb=algeb
                gn.gensan=san
                gn.parent=this.current            
                gn.fullmove_number=this.state.fullmove_number
                gn.turn=this.state.turn
                this.current.childs[san]=gn
            }
            this.current=this.current.childs[san]                

            // restart analysis if necessary
            if(this.enginerunning){
                this.analyze()
            }
        }
    }    

    advanceTurn(){
        this.advanceTurnOnce()
    }
    
    isMoveLegal(m:Move):boolean{return this.toRichMove(m)!=null}

    toRichMove(m:Move,strict:boolean=true):Move{        
        let p=this.getPieceAtSquare(m.fromsq)
        if(p.color!=this.state.turn) return null
        let lms=this.legalMoves([p,m])     
        for(let i in lms){
            let cm=lms[i]
            let ok=cm.isEqualTo(m)
            if(!strict) ok=cm.isRoughlyEqualTo(m)
            if(ok){
                return cm
            }
        }
        return null
    }

    legalMoves(limitTo:[Piece,Move]=null):Move[]{
        let pseudoLegalMoves
        if(limitTo==null) pseudoLegalMoves=this.pseudoLegalMoves()
        else pseudoLegalMoves=this.pseudoLegalMovesForPieceAtSquare(limitTo[0],limitTo[1].fromsq)[0]        
        let lmoves:Move[]=[]
        let wk=this.whereIsKing()
        if(wk!=null){
            let iskingmove=(limitTo==null)||(wk.isEqualTo(limitTo[1].fromsq))
            if(iskingmove){
                // castling moves
                for(let side=0;side<=1;side++){
                    let turn=this.state.turn
                    if(this.state.castlingRights[turn][side]){
                        let cr=this.castlingRegistries[turn][side]
                        let esok=true
                        for(let esi in cr.emptySquares){
                            let esq=cr.emptySquares[esi]
                            if(!this.isSquareEmpty(esq)){
                                esok=false
                                break
                            }
                        }                
                        if(esok){
                            let psok=true
                            for(let psi in cr.passingSquares){
                                let psq=cr.passingSquares[psi]
                                if(this.isSquareAttacked(psq)){
                                    psok=false
                                    break
                                }
                            }    
                            if(psok){
                                lmoves.push(
                                    new Move(cr.kingSquare,cr.rookSquare).
                                    Castling()
                                )
                            }
                        }
                    }
                }
            }
        }
        // other pseudo legal moves        
        for(let i in pseudoLegalMoves){
            let testm=pseudoLegalMoves[i]
            if((limitTo==null)||(testm.isRoughlyEqualTo(limitTo[1]))){
                let testb=new Board().Variant(this.variant).Construct()
                testb.setFromFen(this.reportFen())
                testb.makeMove(testm,false)            
                if(!testb.isColorInCheck(this.state.turn)) lmoves.push(testm)
            }
        }        
        return lmoves
    }

    pseudoLegalMoves(){
        let moves:Move[]=[]
        for(let f=0;f<this.cfg.numFiles;f++){
            for(let r=0;r<this.cfg.numRanks;r++){
                let sq=new Square(f,r)
                let p=this.getPieceAtSquare(sq)
                if(p.color==this.state.turn){                    
                    let [ms,capture]=this.pseudoLegalMovesForPieceAtSquare(p,sq)
                    moves=moves.concat(ms)
                }                
            }
        }
        return moves
    }
    
    pseudoLegalMovesForPieceAtSquare(
        p:Piece,
        sq:Square,
        stopatfirstcapture:boolean=false,
        capturekind:string=null // has to be set if stopatfirstcapture is true
    ):[Move[],boolean]{        
        let moves:Move[]=[]
        if(p.kind=="p"){            
            let pdir=this.cfg.pawnDirectionsByColor[p.color]
            let basepawn = ( ! (this.isSquareValid(sq.Minus(pdir).Minus(pdir))) )
            let aheadsq=sq.Plus(pdir)
            let pushbytwosq=aheadsq.Plus(pdir)
            if(this.isSquareValid(aheadsq)){
                if(this.isSquareEmpty(aheadsq)){
                    // pawn push by one square
                    if(this.isSquareValid(pushbytwosq)){
                        // normal push
                        moves.push(
                            new Move(sq,aheadsq).
                            PawnPush(1)
                        )
                    } else {
                        // promotion pushes
                        for(let ppi in this.cfg.promotionPieces){
                            let kind=this.cfg.promotionPieces[ppi]
                            // promotion push
                            moves.push(
                                new Move(sq,aheadsq,new Piece(kind,p.color)).
                                PawnPush(1)
                            )
                        }
                    }
                    if(basepawn){                        
                        if(this.isSquareValid(pushbytwosq)){
                            if(this.isSquareEmpty(pushbytwosq)){
                                // pawn push by two squares                                
                                moves.push(
                                    new Move(sq,pushbytwosq).
                                    PawnPush(2).
                                    EpSquare(new EpSquare(
                                        aheadsq,
                                        pushbytwosq,
                                        this.cfg.lastPlayer,
                                        p.color
                                    ))
                                )
                            }
                        }
                    }
                }
            }
            for(let dc=-1;dc<=1;dc+=2){                
                let epd=this.getEffectivePawnDirection(pdir,dc)
                let capsq=sq.Plus(epd)                
                if(this.isSquareValid(capsq)){
                    if(this.isSquareEmpty(capsq)){
                        for(let ei=0;ei<this.state.getNumEpSquares();ei++){
                            let esq=this.state.getEpSquare(ei)
                            if(esq.isEqualToSq(capsq)){
                                // ep capture
                                let epclsq=capsq.Minus(pdir)
                                moves.push(
                                    new Move(sq,capsq).
                                    EpClearSquare(esq.clsq)
                                )
                            }
                        }
                    }
                    else if(this.squareHasPieceOfColor(capsq, p.color, true)){
                        // pawn capture
                        let captureaheadsq=capsq.Plus(pdir)
                        if(this.isSquareValid(captureaheadsq)){                        
                            // normal capture
                            moves.push(
                                new Move(sq,capsq).
                                PawnCapture()
                            )
                        } else {
                            // promotion captures
                            for(let ppi in this.cfg.promotionPieces){
                                let kind=this.cfg.promotionPieces[ppi]
                                // promotion capture
                                moves.push(
                                    new Move(sq,capsq,new Piece(kind,p.color)).
                                    PawnCapture()
                                )
                            }
                        }
                        if(stopatfirstcapture){
                            if(this.getPieceAtSquare(capsq).kind==capturekind){
                                return [moves,true]
                            }
                        }
                    }
                }
            }
        } else {            
            let mvs=Config.getMovevectorsByPieceKind(p.kind)
            for(let i in mvs){
                let mv=mvs[i]
                let csq=sq                    
                while(this.isSquareValid(csq.Plus(mv))){                    
                    csq=csq.Plus(mv)                    
                    if(this.squareHasPieceOfColor(csq,p.color)) break
                    if(this.isSquareEmpty(csq)){
                        // piece move to empty square
                        moves.push(
                            new Move(sq,csq)
                        )
                    } else if(this.squareHasPieceOfColor(csq,p.color,true)){
                        // piece capture
                        moves.push(                            
                            new Move(sq,csq).
                            Capture()
                        )                        
                        if(stopatfirstcapture){
                            if(this.getPieceAtSquare(csq).kind==capturekind){
                                return [moves,true]
                            }
                        }
                        break
                    }
                    if(this.isNonSliding(p)) break
                }
            }
        }
        return [moves,false]
    }

    // draw

    node_():Node_{return BoardDraw.node_.bind(this)()}
    draw(){
        let t=new GlobalUtils.Timer("draw",this.log.bind(this))
        BoardDraw.draw.bind(this)()
        t.report()
    }    

    // utils

    width(){return this.cfg.numFiles*this.SQUARE_SIZE}
    totalwidth(){return this.width()+2*this.BOARD_MARGIN}
    height(){return this.cfg.numRanks*this.SQUARE_SIZE}
    totalheight(){return this.height()+2*this.BOARD_MARGIN}
    indexOf(f:number,r:number):number{return f+this.cfg.numFiles*r}
    getPieceAtSquare(sq:Square):Piece{return this.state.rep[this.indexOf(sq.file,sq.rank)]}
    setPieceAtSquare(sq:Square,p:Piece){this.state.rep[this.indexOf(sq.file,sq.rank)]=p}
    isSquareEmpty(sq:Square):boolean{return this.getPieceAtSquare(sq).empty()}
    advanceTurnOnce(){this.state.turn=this.cfg.turnAdvancer[this.state.turn]}
    IS_FOUR_PLAYER():boolean{return this.variant=="fourplayer"}
    IS_ATOMIC():boolean{return this.variant=="atomic"}
    IS_MAIN():boolean{return (this.purpose=="main")}    
    HAS_WASM():boolean{return this.wb!=undefined}
    isNonSliding(p:Piece):boolean{return ((p.kind=="k")||(p.kind=="n")||(p.kind=="p"))}
    movesAlgeb(moves:Move[]):string[]{return moves.map((m:Move)=>this.moveToAlgeb(m))}
    legalMovesAlgeb():string[]{return this.movesAlgeb(this.legalMoves())}
    variantCode():number{return this.cfg.variantCode}
    
    setFromRawFen(fen:string){
        BoardUtils.setFromRawFen.bind(this)(fen)
        if(this.HAS_WASM()){
            this.wb.setFromRawFen(fen)
        }
    }

    whereIsKing(color:number=this.state.turn):Square{return BoardUtils.whereIsKing.bind(this)(color)}
    getEffectivePawnDirection(pd:Square,dc:number):Square{return BoardUtils.getEffectivePawnDirection.bind(this)(pd,dc)}
    isPieceAttackedAtSquare(p:Piece,sq:Square):boolean{return BoardUtils.isPieceAttackedAtSquare.bind(this)(p,sq)}
    isSquareAttacked(sq:Square,color:number=this.state.turn):boolean{return BoardUtils.isSquareAttacked.bind(this)(sq,color)}
    isColorInGlobalCheck(color:number=this.state.turn):boolean{
        if(this.IS_ATOMIC()){
            let wk=this.whereIsKing(color)
            if(wk==null) return true
        }
        return false
    }
    adjacentKings():boolean{
        let wkw=this.whereIsKing(1)
        if(wkw==null) return false
        let wkb=this.whereIsKing(0)
        if(wkb==null) return false
        let df=Math.abs(wkw.file-wkb.file)
        let dr=Math.abs(wkw.rank-wkb.rank)
        return ((df<=1)&&(dr<=1))
    }
    isColorInCheck(color:number=this.state.turn,globalcheck:boolean=true):boolean{
        if(globalcheck){
            if(this.isColorInGlobalCheck(color)) return true
        }
        if(this.IS_ATOMIC()){
            if(this.adjacentKings()) return false
        }
        return BoardUtils.isColorInCheck.bind(this)(color)
    }
    squareOfIndex(i:number):Square{return BoardUtils.squareOfIndex.bind(this)(i)}
    squareHasPieceOfColor(sq:Square,color:number,exclude:boolean=false){return BoardUtils.squareHasPieceOfColor.bind(this)(sq,color,exclude)}
    rotateSquare(sq:Square,rot:number):Square{return BoardUtils.rotateSquare.bind(this)(sq,rot)}
    squareToAlgeb(sq:Square):string{return BoardUtils.squareToAlgeb.bind(this)(sq)}
    algebToSquare(algeb:string):Square{return BoardUtils.algebToSquare.bind(this)(algeb)}
    algebToMove(algeb:string):Move{return BoardUtils.algebToMove.bind(this)(algeb)}
    moveToAlgeb(m:Move,info:boolean=false):string{return BoardUtils.moveToAlgeb.bind(this)(m,info)}
    isSquareValid(sq:Square):boolean{return BoardUtils.isSquareValid.bind(this)(sq)}
    toNode(gn:GameNode,incremental:boolean=false){
        BoardUtils.toNode.bind(this)(gn,incremental)
        if(this.enginerunning){
            this.analyze()
        }
    }
    toBegin(){BoardUtils.toBegin.bind(this)()}
    back(){BoardUtils.back.bind(this)()}
    forward(){BoardUtils.forward.bind(this)()}    
    toEnd(){BoardUtils.toEnd.bind(this)()}
    del(){
        if(this.current.parent!=null){
            this.toNode(this.current.parent)            
        }
        this.current.childs=<{string:GameNode}>{}
        this.wb.delete()
    }
    squaresBetween(sq1:Square,sq2:Square,withextremes:boolean=false){
        let dir=sq2.Minus(sq1).Normalize()      
        if(dir==null) return null
        let between:Square[]=[]
        let csq=sq1
        do{
            if(csq.isEqualTo(sq2)){
                if(withextremes) between.push(csq)
                return between
            }
            if((csq!=sq1)||(withextremes)) between.push(csq)
            csq=csq.Plus(dir)
        }while(this.isSquareValid(csq))
        return null
    }
    createCastlingRegistries(){
        if(this.state.castlingRights==undefined) this.state.castlingRights=new Array(this.cfg.numPlayers)
        this.castlingRegistries=new Array(this.cfg.numPlayers)
        for(let color=0;color<this.cfg.numPlayers;color++){
            if(this.state.castlingRights[color]==undefined) this.state.castlingRights[color]=[true,true]
            let cregs:CastlingRegistry[]=new Array(2)            
            let wk=this.whereIsKing(color)
            if(wk!=null) {
                for(let side=0;side<=1;side++){                    
                    if(this.state.castlingRights[color][side]){                        
                        let dir=this.cfg.pawnDirectionsByColor[color].Rotate(side==0?1:-1)                        
                        let csq=wk
                        let lastrooksq=null
                        do{
                            let p=this.getPieceAtSquare(csq)                            
                            if((p.kind=="r")&&(p.color==color)) lastrooksq=csq
                            csq=csq.Plus(dir)
                        }while(this.isSquareValid(csq))
                        if(lastrooksq==null) this.state.castlingRights[color][side]=false
                        else {
                            let emptysquares=this.squaresBetween(wk,lastrooksq)
                            let kingtargetsq=wk.Plus(dir).Plus(dir)
                            let passingsquares=this.squaresBetween(wk,kingtargetsq,true)
                            let reg=new CastlingRegistry(
                                wk,
                                lastrooksq,
                                emptysquares,
                                passingsquares
                            )                            
                            cregs[side]=reg
                        }                
                    }                
                }
                this.castlingRegistries[color]=cregs
            } else {
                this.state.castlingRights[color]=[false,false]
            }
        }
    }
    savedCurrent:GameNode
    allnodes:number
    setFromTreeNodeRecursive(tn:TreeNode){                
        for(let san in tn.moves){
            let m=this.sanToMove(san)
            if(m==null) console.log("invalid move "+san)
            else {
                let rm=this.toRichMove(m)
                if(rm==null) console.log("illegal move"+san)
                else {
                    this.allnodes++
                    this.makeMove(rm)
                    this.setFromTreeNodeRecursive(tn.moves[san])
                    this.back()
                }
            }
        }
        if(tn.current) this.savedCurrent=this.current
    }
    setFromTreeNode(tn:TreeNode){
        this.allnodes=0
        this.reset()
        this.savedCurrent=undefined        
        this.setFromTreeNodeRecursive(tn)
        if(this.savedCurrent!=undefined) this.toNode(this.savedCurrent,true)
    }
    reportTree():TreeNode{
        return this.root.reportTreeNode(this.current)
    }
    reportPgn():Pgn{        
        let pgn=new Pgn()
        pgn.variant=this.variant
        pgn.headers=this.pgnHeaders
        pgn.tree=this.reportTree()
        return pgn
    }    
    reportPgnHeadersStr():string{
        let headers:string[]=[]        
        for(let key in this.pgnHeaders){            
            let value=this.pgnHeaders[key]
            let header=`[${key} "${value}"]`            
            headers.push(header)
        }
        if(headers.length<=0) return ""
        return headers.join("\n")+"\n\n"
    }
    reportPgnStrStandard():string{
        let pgnstr=""
        let sanlist:string[]=[]
        let cn=this.root
        while(cn.haschild()){
            let ch=cn.mainchild()
            let mn=""
            if(cn.turn==1) mn=cn.fullmove_number+". "
            sanlist.push(mn+ch.gensan)
            cn=ch
        }
        pgnstr=sanlist.join(" ")
        let hsstr=this.reportPgnHeadersStr()        
        return hsstr+pgnstr
    }
    reportPgnStr():string{
        if(this.cfg.standardReportable) return this.reportPgnStrStandard()
        return JSON.stringify(this.reportPgn())
    }
    setFromPgn(pgn:Pgn){        
        let t=new GlobalUtils.Timer("set from PGN",this.log.bind(this))        
        this.variant=pgn.variant
        this.Construct()
        if(pgn.headers!=undefined) this.pgnHeaders=pgn.headers
        this.setFromTreeNode(pgn.tree)
        t.report()
        this.log("number of nodes "+this.allnodes)
        this.draw()
    }
    setFromPgnStrStandard(pgnstr:string){        
        pgnstr=pgnstr.replace(new RegExp("\\r","g"),"",)
        let lines=pgnstr.split("\n")
        this.pgnHeaders={}
        let movelistbuffer:string[]=[]
        let moveliststarted=false
        for(let li in lines){
            let line=lines[li]            
            let t=new Utils.Tokenizer(line)
            if(!moveliststarted){
               let c=t.pull(["["])
               if(c!=""){
                    let key=t.pull(null)
                    t.pull([" ","\""])
                    let value=t.pullUntil("\"")
                    this.pgnHeaders[key]=value
               } else {
                    let token=t.pull(null)
                    if(token!=""){
                        moveliststarted=true
                        movelistbuffer.push(line)
                    }
               }
            } else {
                movelistbuffer.push(line)
            }
        }        
        let movelist=movelistbuffer.join(" ")        
        let sanlist:string[]=[]
        let t=new Utils.Tokenizer(movelist)
        let san
        do{
            san=t.pullSan()
            if(san!=""){
                sanlist.push(san)
            }
        }while(san!="")                
        this.reset()
        sanlist.map(san=>{
            let m=this.sanToMove(san)            
            let rm=this.toRichMove(m)                        
            this.makeMove(rm)
        })
        this.log("number of sans "+sanlist.length)
        this.draw()
    }
    setFromPgnStr(pgnstr:string){
        if(this.cfg.standardReportable){
            this.setFromPgnStrStandard(pgnstr)
            return
        }
        let pgn=JSON.parse(pgnstr)
        this.setFromPgn(pgn)        
    }
    mainlog:GlobalUtils.Logger=new GlobalUtils.Logger()
    log(item:string){
        this.mainlog.log(item)        
        if(this.tabs!=undefined){
            let loghtml=this.reportLogHtml()
            setTimeout((Event)=>{
                this.tabs.setContent("log",loghtml)
            },50)
        }
    }
    reportLogHtml():string{          
        return this.mainlog.logitems.slice().reverse().map(x=>x+"<br>").join("\n")
    }
    correctPromLetter(kind:string):string{
        if(!this.cfg.standardReportable) return kind
        if(this.state.turn==0) return kind
        return kind.toUpperCase()
    }
    moveToSan(m:Move):string{
        let [san,rm]=this.moveToSanNotCastlingCorrected(m)
        if((!this.cfg.standardReportable)||(!rm.castling)) return san
        let csm=Config.STANDARD_CASTLE_SAN_MAPPINGS[this.state.turn]
        let csan=csm.g(san)
        return csan
    }
    moveToSanNotCastlingCorrected(m:Move):[string,Move]{        
        let rm=this.toRichMove(m)
        if(rm==null) return null        
        let fromsqalgeb=this.squareToAlgeb(rm.fromsq)
        let tosqalgeb=this.squareToAlgeb(rm.tosq)
        let algeb=this.moveToAlgeb(m)        
        if(rm.pawnmove){
            let prom=(m.promotion?"="+this.correctPromLetter(m.prom.kind):"")
            if(rm.capture){
                let efsa=fromsqalgeb
                if(this.cfg.standardReportable) efsa=fromsqalgeb[0]
                return [efsa+"x"+tosqalgeb+prom,rm]
            } else {
                return [tosqalgeb+prom,rm]
            }
        }
        let fromsq=m.fromsq
        let tosq=m.tosq
        let p=this.getPieceAtSquare(fromsq)        
        let lms=this.legalMoves([new Piece(p.kind,100),new Move(tosq,null)])        
        let efs=0
        let ers=0        
        let es=0
        for(let lmi in lms){
            let lm=lms[lmi]            
            let tfromsq=lm.tosq
            let tfp=this.getPieceAtSquare(tfromsq)            
            if(tfp.equalto(p)){                
                if(!tfromsq.isEqualTo(fromsq)){                    
                    es++
                    if(tfromsq.file==fromsq.file) efs++
                    if(tfromsq.rank==fromsq.rank) ers++                    
                }
            }
        }
        let P=p.kind.toUpperCase()
        let cl=rm.capture?"x":""                
        if(es==0) return [P+cl+tosqalgeb,rm]
        if((efs>0)&&(ers>0)) return [P+fromsqalgeb+cl+tosqalgeb,rm]
        if(efs>0) return [P+fromsqalgeb.substring(1)+cl+tosqalgeb,rm]
        return [P+fromsqalgeb.substring(0,1)+cl+tosqalgeb,rm]
    }

    sanToRichMove(san:string):Move{
        let m=this.sanToMove(san)
        if(m==null) return null
        return this.toRichMove(m)
    }

    makeSanMove(san:string){
        let rm=this.sanToRichMove(san)
        if(rm!=null){
            this.makeMove(rm)
        }
    }

    sanToMove(san:string):Move{
        let parts=san.split("=")
        let sannonprom=parts[0]
        let pp=new Piece()
        if(parts.length>1){
            let pkind=parts[1][0].toLowerCase()
            pp=new Piece(pkind,this.state.turn)
        }
        let m=this.sanToMoveNonPromotion(sannonprom,pp)
        if(m==null) return null
        if(parts.length<=1) return m        
        m.prom=pp
        return m
    }

    sanToMoveNonPromotion(san:string,prompiece:Piece):Move{                
        if(this.cfg.standardReportable){
            let csm=Config.STANDARD_CASTLE_SAN_MAPPINGS[this.state.turn]
            let csan=csm.g(san)
            if(csan!=null) san=csan
        }
        let sannox=san.replace("x","")
        let t=new Utils.Tokenizer(sannox)
        let cap=t.pull(this.cfg.nonPawnPiecesCapital,1)        
        let sq1=t.pullSquare(this)
        let sq2=t.pullSquare(this)
        let fromsq=sq1
        let tosq=sq2        
        if(sq1==null) return null
        if(sq2==null){
            fromsq=new Square(null,null)
            tosq=sq1
        }        
        if(cap!=""){            
            let kind=cap.toLowerCase()                        
            let rp=new Piece(kind,this.state.turn)                

            if(kind=="k"){
                let wk=this.whereIsKing()
                if(wk!=null){                    
                    let klms=this.legalMoves([rp,new Move(wk,null)])
                    for(let klmsi in klms){
                        let klm=klms[klmsi]                        
                        if(klm.tosq.isEqualTo(tosq)) return klm
                    }
                }
            }

            let lms=this.pseudoLegalMovesForPieceAtSquare(new Piece(kind,100),tosq)[0]            
            
            for(let lmi in lms){
                let lm=lms[lmi]                
                let p=this.getPieceAtSquare(lm.tosq)                
                if(p.equalto(rp)){                                        
                    if(lm.tosq.isRoughlyEqualTo(fromsq)) return new Move(lm.tosq,tosq)
                }
            }            
        } else {
            let pdir=this.cfg.pawnDirectionsByColor[this.state.turn]            
            let testsqs:Square[]=[]
            let bsq=tosq.Minus(pdir)
            testsqs.push(bsq)
            testsqs.push(bsq.Plus(pdir.Rotate(1)))
            testsqs.push(bsq.Plus(pdir.Rotate(-1)))                        
            if(this.isSquareValid(bsq)){
                if(this.getPieceAtSquare(bsq).empty()){                    
                    let bsq2=bsq.Minus(pdir)                        
                    let bsq2test=bsq2.Minus(pdir).Minus(pdir)                    
                    if(!this.isSquareValid(bsq2test)) testsqs.push(bsq2)
                }
            }
            let testp=new Piece("p",this.state.turn)            
            for(let ti in testsqs){
                let tsq=testsqs[ti]                                
                if(this.isSquareValid(tsq)){                    
                    if(this.getPieceAtSquare(tsq).equalto(testp)){                        
                        if(tsq.isRoughlyEqualTo(fromsq)){                            
                            let trymove=new Move(tsq,tosq,prompiece)                            
                            if(this.isMoveLegal(trymove)) return trymove
                        }
                    }
                }
            }
        }
        return null
    }
    pgnStoreKey():string{
        return "pgn_"+this.variant
    }
    constructFromVariant(variant:string){
        this.Variant(variant).Construct()
        let pgnstr=localStorage.getItem(this.pgnStoreKey())
        if(pgnstr!=undefined){
            this.setFromPgnStr(pgnstr)
        } else {
            this.draw()
        }
    }
    setDefaultPgnHeaders(){
        this.pgnHeaders={
            "Variant":BoardDraw.variantDisplayName(this.variant),
            "FEN":this.startfen
        }
    }
    drawMoveArrow(m:Move,div:Div_=null,params:{[id:string]:any}={}){
        let fromsq=this.rotateSquare(m.fromsq,this.flip)
        let tosq=this.rotateSquare(m.tosq,this.flip)
        let fromv=new GlobalUtils.Vect(fromsq.file+0.5,fromsq.rank+0.5).s(this.SQUARE_SIZE*Config.scalefactor)
        let tov=new GlobalUtils.Vect(tosq.file+0.5,tosq.rank+0.5).s(this.SQUARE_SIZE*Config.scalefactor)
        if(params["scale"]==undefined){
            params["scale"]=1.0
        }
        if(params["constantwidth"]==undefined){
            params["constantwidth"]=this.SQUARE_SIZE/7.5*Config.scalefactor*params["scale"]
        }                
        let arrow=new GlobalUtils.Arrow(fromv,tov,params)
        let adiv:Div_=(div==null?new Div_():div)
        adiv.
            spos("absolute").
            stpx(arrow.svgorig.y).
            slpx(arrow.svgorig.x).
            szi(Board.ARROW_Z_INDEX).
            html(arrow.svg)
        this.rootnode.a(adiv)
    }
    drawMoveArrowAlgeb(algeb:string,div:Div_=null,params:{[id:string]:any}={}){
        let m=this.algebToMove(algeb)
        this.drawMoveArrow(m,div,params)
    }
    ws:WebSocket
    connectid:number=0
    logws(msg:string,connectid:number,details:string=""){
        this.log("[ "+connectid+" ] "+msg+(details!=""?" : ":"")+details)
    }
    sendem(em:EngineMessage,connectid:number){
        let json=JSON.stringify(em)
        this.logws("sending message",connectid,json)
        
        /////////////////////////////////////////////
        this.ws.send(json)
        /////////////////////////////////////////////        
    }
    defaultengine:string
    startengine(name:string=this.defaultengine){
        if(this.defaultengine==undefined){
            this.log("no engine available")
            return
        }
        let em=new EngineMessage().
            _action("start").
            _name(name)
        this.connect(em)
    }
    tolog:GlobalUtils.Logger=new GlobalUtils.Logger()
    thinkingoutput:Utils.ThinkingOutput
    getenginecolor():string{
        return (this.thinkingoutput.score>0?Board.POS_EVAL_MOVE_COL:Board.NEG_EVAL_MOVE_COL)
    }
    displayenginescore(){
        let ecol=this.getenginecolor()
        this.depthdiv.
        spos("absolute").
        stpx(this.width()/5.0).
        slpx(this.width()/5.0).
        szi(Board.ARROW_Z_INDEX+1).
        sfsspx(this.SQUARE_SIZE).
        scol(Board.ENGINE_DEPTH_COL).
        html(""+this.thinkingoutput.depth)
        this.scorediv.
        spos("absolute").
        stpx(this.width()/3.0).
        slpx(this.width()/3.0).
        szi(Board.ARROW_Z_INDEX+1).
        sfsspx(this.SQUARE_SIZE*2.0).
        scol(ecol).
        html(""+this.thinkingoutput.score)
    }
    onmessage(connectid:number,e:MessageEvent){
        //this.logws("connection sent",connectid,e.data)
        let em=new EngineMessage().parseJson(e.data)        
        if(em.action=="available"){
            this.logws("available",connectid,em.available.toString())
            this.defaultengine=em.available[0]
            this.startengine()
        }
        if(em.action=="thinkingoutput"){
            this.tolog.log(em.buffer)
            let content=this.tolog.logitems.slice().reverse().join("\n")
            this.fentext.setText(content)
            if(this.enginerunning){            
                let to=this.thinkingoutput                
                to.parse(em.buffer)
                let algeb=this.thinkingoutput.bestmove
                if(algeb!=""){
                    let m=this.algebToMove(algeb)
                    if(this.isMoveLegal(m)){
                        let color=this.getenginecolor()
                        let params={"color":color,"scale":1.5}
                        this.drawMoveArrowAlgeb(algeb,this.enginearrow,params)
                        this.displayenginescore()
                    }
                }
            }
        }
    }
    wsopen(connectid:number,em:EngineMessage=null,e:Event){
        this.logws("connection opened",connectid)
        if(em!=null) this.sendem(em,connectid)     
    }
    connect(em:EngineMessage=new EngineMessage()._action("sendavailable")){
        this.tabs.setSelected("log")
        this.connectid++
        this.logws("connecting to server...",this.connectid)
        this.ws=new WebSocket("ws://localhost:9000/ws")        
        this.ws.onopen=this.wsopen.bind(this,this.connectid,em)
        this.ws.onmessage=this.onmessage.bind(this,this.connectid)
    }
    enginerunning:boolean=false
    analyze(){
        if(this.defaultengine==undefined){
            this.log("no engine available")
            return
        }
        this.thinkingoutput=new Utils.ThinkingOutput()
        this.stopanalysis()
        let fen=this.reportFen()
        let em=new EngineMessage().
            _action("issue").
            _command(`position fen ${fen}\ngo infinite\n`)
        this.sendem(em,this.connectid)
        this.enginerunning=true
    }
    stopanalysis(){        
        this.enginerunning=false
        if(this.defaultengine==undefined){
            this.log("no engine available")
            return
        }
        let em=new EngineMessage().
            _action("issue").
            _command(`stop`)
        this.sendem(em,this.connectid)        
    }
    makeanalyzedmove(){
        if(this.defaultengine==undefined){
            this.log("no engine available")
            return
        }
        if(this.thinkingoutput==undefined){
            this.log("no thinking output")
            return
        }
        let algeb=this.thinkingoutput.bestmove
        if(algeb!=""){
            let m=this.algebToMove(algeb)
            let rm=this.toRichMove(m)
            if(rm!=null){                
                this.makeMove(rm)
                this.draw()
            }
        }
    }
}