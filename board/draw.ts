namespace BoardDraw {

export function node_():Node_{
    this.pids=[]
    let boardcontainer=new Div_("boardcontainer").
        swspx(this.totalwidth()).
        shspx(this.totalheight()).            
        sburl("assets/images/backgrounds/wood.jpg").
        szi(Board.CONTAINER_Z_INDEX).
        spos("relative").
        finalize()
    let rootnode=new Div_("board").
        swspx(this.width()).
        shspx(this.height()).
        stspx(this.BOARD_MARGIN).
        slspx(this.BOARD_MARGIN).
        sburl("assets/images/backgrounds/wood.jpg").
        spos("absolute").
        szi(Board.BACKGROUND_Z_INDEX).
        finalize()
    
    for(let nf=0;nf<this.cfg.numFiles;nf++){
        for(let nr=0;nr<this.cfg.numRanks;nr++){                
            let sq=new Square(nf,nr)
            let algeb=this.squareToAlgeb(sq)
            let rsq=this.rotateSquare(sq,this.flip)
            let f=rsq.file
            let r=rsq.rank          
            let sqdiv=new Div_().
                stspx(r*this.SQUARE_SIZE).
                slspx(f*this.SQUARE_SIZE).
                swspx(this.SQUARE_SIZE).
                shspx(this.SQUARE_SIZE).
                sbcol((((nr+nf)%2)==0)?Board.LIGHT_SQUARE_COLOR:Board.DARK_SQUARE_COLOR).
                spos("absolute").
                sop(Board.SQUARE_OPACITY).                                        
                szi(Board.SQUARE_Z_INDEX).
                finalize()                
            if(this.isSquareValid(sq)){rootnode.appendChild(sqdiv)}
            let p=this.getPieceAtSquare(new Square(nf,nr))
            if(!p.empty()){
                let svg=RawData.pieces[p.kind]
                let fillcol=Board.PIECE_FILL_COLORS[p.color]
                let strokecol=Board.PIECE_STROKE_COLORS[p.color]
                svg = svg.replace("fill=\"#101010\"","fill=\""+fillcol+"\"")
                svg = svg.replace("fill:#ececec","fill:"+strokecol)
                svg = svg.replace("stroke:#101010","stroke:"+fillcol)                    
                let pid="piece_"+algeb
                let pdiv=new Div_(pid).
                    stspx(r*this.SQUARE_SIZE+this.SQUARE_PADDING).
                    slspx(f*this.SQUARE_SIZE+this.SQUARE_PADDING).
                    swspx(this.PIECE_SIZE).
                    shspx(this.PIECE_SIZE).                    
                    spos("absolute").
                    sop(Board.PIECE_OPACITIES[p.color]).
                    attr("draggable","true").
                    szi(Board.PIECE_Z_INDEX).
                    html(svg).                
                    addel("dragstart",piecedragstart.bind(this,pid))
                rootnode.appendChild(pdiv)
                this.pids.push(pid)
            }
        }
    }
    rootnode.addel("mousemove",boardmousemove.bind(this))
    rootnode.addel("mouseup",boardmouseup.bind(this)) 
    this.rootnode=rootnode
    if(this.current.parent!=null){
        this.drawMoveArrowAlgeb(this.current.genalgeb)
    }
    let eadiv=new Div_()
    this.enginearrow=eadiv
    let depthdiv=new Div_()
    this.depthdiv=depthdiv
    let scorediv=new Div_()
    this.scorediv=scorediv
    rootnode.a(eadiv)
    rootnode.a(depthdiv)
    rootnode.a(scorediv)
    boardcontainer.a(rootnode)       
    return boardcontainer
}

export function variantDisplayName(k:string){
    return Config.chessConfigurationManager.getConfigurationByVariantId(k).variantDisplayName
}

export function draw(){                        
    if(this.anchorid!=""){        
        let anchordiv=doc.getNode_ById(this.anchorid)
        anchordiv.innerHTML("")
        let table=new Table_()
        let tr1=new Tr_()
        let tr2=new Tr_()
        table.a(tr1)
        table.a(tr2)
        let boardtd=new Td_()
        boardtd.a(this.node_())        
        let controlsdiv=new Div_()            
        let variantcombo=new Select_(varianthandler.bind(this))
        for(let i in Config.SUPPORTED_VARIANTS){
            let k=Config.SUPPORTED_VARIANTS[i]
            let v=variantDisplayName(k)
            let s=( k == this.variant )
            variantcombo.a(new Option_(k,v,s))
        }
        controlsdiv.a(variantcombo)
        controlsdiv.a(new Button_("F",fliphandler.bind(this)))
        controlsdiv.a(new Button_("<<",tobeginhandler.bind(this)))
        controlsdiv.a(new Button_("<",backhandler.bind(this)))
        controlsdiv.a(new Button_(">",forwardhandler.bind(this)))
        controlsdiv.a(new Button_(">>",toEndhandler.bind(this)))
        controlsdiv.a(new Button_("D",delhandler.bind(this)))
        controlsdiv.a(new Button_("R",resethandler.bind(this)))
        controlsdiv.a(new Button_("Rnd",randomhandler.bind(this)))        
        controlsdiv.a(new Button_(">",analyzehandler.bind(this)))
        controlsdiv.a(new Button_("_",stopanalysishandler.bind(this)))
        controlsdiv.a(new Button_("*",makeanalyzedmovehandler.bind(this)))
        controlsdiv.a(new Button_("!",starthandler.bind(this)))
        boardtd.a(controlsdiv) 
        tr1.a(boardtd)       
        let movestd=new Td_().            
            swspx(this.width()/3.0).
            spos("relative").
            finalize()
        let movesdiv=
            new Div_().sovf("scroll").
            shspx(this.totalheight()).
            swspx(this.width()/3.0).
            stpx(0).
            slpx(0).
            sff("monospace").
            spos("absolute").
            finalize()

        /*let moveinfos:[string,Move][]=this.legalMoves().map(x=>[this.moveToSan(x),x])
        moveinfos.sort((a:[string,Move],b:[string,Move])=>{
            if((a[0][0].toLocaleUpperCase()==a[0][0])&&(b[0][0].toLocaleUpperCase()!=b[0][0])) return -1
            if((b[0][0].toLocaleUpperCase()==b[0][0])&&(a[0][0].toLocaleUpperCase()!=a[0][0])) return 1
            return a[0].localeCompare(b[0],"en")
        })
        
        moveinfos.map(mi=>{            
            movesdiv.a(new A_("#",mi[0],legalmoveclicked.bind(this,mi[1])))
            movesdiv.a(new Br_())
        })*/

        let wb:wBoard=this.wb

        let sortedlegalsans:string[]=wb.sortedLegalSanList().split("\n")

        sortedlegalsans.map(san=>{
            movesdiv.a(new A_("#",san,legalmoveclicked.bind(this,san)))
            movesdiv.a(new Br_())
        })

        movestd.a(movesdiv)
        let gametd=new Td_()
        let pgn=this.reportPgnStr()
        localStorage.setItem(this.pgnStoreKey(),pgn)
        localStorage.setItem("currentvariant",this.variant)
        let gamediv=new Div_().swspx(this.width()).shspx(this.totalheight()/2.0).
        sff("monospace").sovf("scroll").html(pgn)
        let logdiv=new Div_("logdiv").swspx(this.width()).shspx(this.totalheight()/2.0).
        sff("monospace").sovf("scroll").finalize()
        let loghtml=this.reportLogHtml()
        logdiv.innerHTML(loghtml)
        gametd.a(gamediv)        
        gametd.a(logdiv)                
        tr1.a(movestd)        
        let tp=new TabPane_("tabs",this.width(),this.totalheight(),[
            new Tab("pgn","PGN"),
            new Tab("log","Log"),
            new Tab("san","San"),
            new Tab("pres","Pres")
        ])
        let pgncontrolsdiv=new Div_()
        let pgnkeytext=new Text_()
        let pgnvaluetext=new Text_()
        this.pgnkeyinput=pgnkeytext
        this.pgnvalueinput=pgnvaluetext
        let pgnheaderbutton=new Button_("Change",pgnheaderhandler.bind(this))
        let pgnprediv=new Div_().
            swspx(this.width()).
            sff("monospace").
            html("<hr>"+pgn.replace(new RegExp("\\n","g"),"<br>"))
        pgncontrolsdiv.a(pgnkeytext).a(pgnvaluetext).a(pgnheaderbutton)
        let pgndiv=new Div_().a(pgncontrolsdiv).a(pgnprediv)
        tp.setNode_("pgn",pgndiv)
        tp.setContent("log",loghtml)
        let sidiv=new Div_()
        let si=new Text_()
        this.saninput=si
        let sib=new Button_("Make",makesanhandler.bind(this))
        sidiv.a(si)
        sidiv.a(sib)
        tp.setNode_("san",sidiv)
        let presdiv=new Div_().
            swspx(this.width()).
            sff("monospace").
            finalize()
        let pcb=new Button_("Connect",connecthandler.bind(this))
        presdiv.a(pcb)
        this.presdiv=presdiv
        tp.setNode_("pres",presdiv)
        tr1.a(tp)
        this.tabs=tp
        //tr1.a(gametd)
        let infotd=new Td_(3)       
        let t=new Textarea_(10)
        t.swspx(this.width()*(2+1/3)).finalize()
        this.fentext=t
        infotd.a(t.setText(this.reportFen()))
        tr2.a(infotd)

        anchordiv.a(table)

        this.dragz=Board.DRAGGED_PIECE_Z_INDEX

        wboarddraw.bind(this)()
    }
}

function varianthandler(e:Event){
    let t=<any>e.target
    let selectedVariantId=t.selectedOptions[0].id        
    this.constructFromVariant(selectedVariantId)
}

function fliphandler(e:Event){
    this.flip+=1
    if(this.flip>3) this.flip=0
    this.draw()
}

function tobeginhandler(e:Event){        
    this.toBegin()
    this.draw()
}

function backhandler(e:Event){        
    this.back()
    this.draw()
}

function forwardhandler(e:Event){
    this.forward()
    this.draw()
}

function toEndhandler(e:Event){        
    this.toEnd()
    this.draw()
}

function delhandler(e:Event){        
    this.del()
    this.draw()
}

function resethandler(e:Event){
    if(this.enginerunning) this.stopanalysis()
    this.reset()
    this.wb.deleteGameInfo()
    this.draw()
}

export function randomhandler(e:Event){
    if(this.randomon){
        this.randomon=false
        return
    }
    this.randomon=true
    makerandom.bind(this)()
}

export function analyzehandler(e:Event){
    this.analyze()
}

export function stopanalysishandler(e:Event){
    this.stopanalysis()
}

export function makeanalyzedmovehandler(e:Event){
    this.makeanalyzedmove()
}

export function starthandler(e:Event){
    this.startengine()
}

function makerandom(){
    if(!this.randomon) return
    let lms=this.legalMoves()
    if(lms.length>0){
        let ri=Math.floor(Math.random()*lms.length)
        if(ri>=lms.length){ri=0}
        this.makeMove(lms[ri])
        this.draw()
    }
    setTimeout(makerandom.bind(this),110)
}

function boardmousemove(e:Event){
    let me=<MouseEvent>e          
    if(this.dragunderway){            
        let client=new ScreenVector(me.clientX,me.clientY)
        this.dragd=client.Minus(this.dragstart)            
        let nsv=this.dragstartst.Plus(this.dragd)
        let st=new Div_().decomposestyle(doc.getStyleOfId(this.draggedid))
        st.slpx(nsv.x)
        st.stpx(nsv.y)
        st.szi(this.dragz)
        doc.setStyleOfId(this.draggedid,st.reportstyle())
    }
}

function boardmouseup(e:Event){        
    let me=<MouseEvent>e
    if(this.dragunderway){
        this.dragunderway=false
        let dragdcorr=this.dragd.Plus(this.HALF_SQUARE_SIZE_SCREENVECTOR.Scaled())
        let dragdnom=dragdcorr.UnScaled()
        let dsq=screenvectortosquare.bind(this)(dragdnom)
        let dsv=squaretoscreenvector.bind(this)(dsq).Scaled()
        let nsv=this.dragstartst.Plus(dsv)
        let st=new Div_().decomposestyle(doc.getStyleOfId(this.draggedid))
        st.slpx(nsv.x)
        st.stpx(nsv.y)
        doc.setStyleOfId(this.draggedid,st.reportstyle())
        let draggedalgeb=Utils.idpart(this.draggedid,1)
        let fromsqorig=this.rotateSquare(this.algebToSquare(draggedalgeb),this.flip)
        let tosq=this.rotateSquare(fromsqorig.Plus(dsq),-this.flip)
        let toalgeb=this.squareToAlgeb(tosq)
        let moveToAlgeb=draggedalgeb+toalgeb
        let m=this.algebToMove(moveToAlgeb)        
        let rm=this.toRichMove(m,false)        
        if(rm!=null){
            if(rm.promotion){
                let kind=prompt("Enter promotion piece letter [ n / b / r / q ] !")
                if((kind=="undefined")||(kind==null)||(kind=="")) {}
                else if(this.cfg.promotionPieces.indexOf(kind)<0) alert("Invalid piece letter!")
                else{
                    rm.prom=new Piece(kind,this.state.turn)
                    this.makeMove(rm)
                }
            }else{
                this.makeMove(rm)
            }
        }
        this.draw()        
    }
}

function piecedragstart(pid:string,e:Event){        
    let me=<MouseEvent>e
    me.preventDefault()
    this.draggedid=pid
    this.dragstart=new ScreenVector(me.clientX,me.clientY)            
    this.dragz+=1
    if(this.pids.indexOf(this.draggedid)>=0){
        let st=new Div_().decomposestyle(doc.getStyleOfId(this.draggedid))
        this.dragstartst=new ScreenVector(st.getpx("left"),st.getpx("top"))       
        this.dragunderway=true        
    } else {
        console.log("wrong drag id: "+this.draggedid)
        this.draw()
    }
}

function legalmoveclicked(san:string,e:Event){    
    this.makeSanMove(san)
    this.draw()
}

function makesanhandler(e:Event){        
    let san=this.saninput.getText()
    this.log("making move "+san)
    let m=this.sanToMove(san)
    if(m==null){
        this.log("invalid move")
        return
    }    
    let rm=this.toRichMove(m)
    if(rm==null){
        this.log("illegal move")
        return
    }
    this.makeMove(rm)
    this.draw()
}

function pgnheaderhandler(e:Event){        
    let key=this.pgnkeyinput.getText()
    let value=this.pgnvalueinput.getText()
    if(value==""){
        delete this.pgnHeaders[key]
    } else {
        this.pgnHeaders[key]=value
    }
    this.draw()
}

function connecthandler(e:Event){        
    this.connect()
}

function screenvectortosquare(sv:ScreenVector):Square{
    let f = Math.floor( sv.x / this.SQUARE_SIZE )
    let r = Math.floor( sv.y / this.SQUARE_SIZE )
    return new Square(f,r)
}

function squaretoscreenvector(sq:Square):ScreenVector{
    let x = sq.file * this.SQUARE_SIZE
    let y = sq.rank * this.SQUARE_SIZE
    return new ScreenVector(x,y)
}

function wboarddraw(){
    if(!this.HAS_WASM()) return
    let wb:wBoard=this.wb
    console.log(wb.reportBoardText())
    console.log(wb.out(2))    
}

}