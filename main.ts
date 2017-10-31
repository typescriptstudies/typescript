//localStorage.clear()

new Board().AnchorId("root").Main().wConstruct(b=>{
    let cv=localStorage.getItem("currentvariant")    
    if(cv!=undefined) b.constructFromVariant(cv)
    else b.draw()
    //BoardDraw.randomhandler.bind(b)(null)
})

