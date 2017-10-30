#include "types.h"
#include "utils.h"
#include "boardutils.h"
#include "game.h"

uint8_t game_initialized_reported=0;

// core board functions

void newBoard(int variant,int i){
	Board *b=&boards[i];
	b->test=0;
	b->index=i;
	b->variant=variant;
	b->numfiles=8;	
	b->numranks=8;
	b->numplayers=2;
	if(variant>FOUR_PLAYER_BASE){
		b->numfiles=14;
		b->numranks=14;
		b->numplayers=4;
	}
	b->lastplayer=b->numplayers-1;
	b->lastfile=b->numfiles-1;
	b->lastrank=b->numranks-1;
	for(int r=0;r<b->numranks;r++)
	{
		for(int f=0;f<b->numfiles;f++)
		{
			b->rep[r][f].kind='-';
			b->rep[r][f].color='0';
		}
	}
	resetEpSquares(b);
	resetCastlingRegistries(b);
	b->turn='1';
	b->fullmove_number=1;
	b->halfmove_clock=0;
	b->checkattack=0;
	b->stm=0;

	// init game
	if(!game_initialized){
		init_game();
	}

	b->root=&root_gamenodes[b->index];
	b->current=b->root;

	b->root->parent=0;
	b->root->child=0;
	b->root->prevsibling=0;
	b->root->nextsibling=0;
}

str pseudoLegalVectorMovesForPieceAt(Board *b,int df,int dr,uint8_t single,Piece p,uint8_t f,uint8_t r,str ptr){	
	int cf=f+df;
	int cr=r+dr;

	while(fileRankOk(b,cf,cr)){		
		Piece topiece=b->rep[cr][cf];		
		uint8_t toempty=(topiece.kind=='-');
		uint8_t tosamecolor=(topiece.color==p.color);		
		if((!toempty)&&(tosamecolor)){			
			// bumped into own piece			
			if(!b->checkattack) b->mptr->invalid=1;
			*ptr=0;
			return ptr;
		} else {
			if(!b->checkattack){
				defaultMove(b);
				b->mptr->fsq.f=f;
				b->mptr->fsq.r=r;
				b->mptr->tsq.f=cf;
				b->mptr->tsq.r=cr;
			}
			if(toempty){
				if(!b->checkattack){
					recordMove(b);	
				}				
			} else {
				// capture											
				if(b->checkattack){
					if(b->rep[cr][cf].kind==p.kind){
						b->isattack=1;						
					}
					*ptr=0;
					return ptr;
				} else {
					b->mptr->capture=1;
					recordMove(b);				
					*ptr=0;
					return ptr;
				}
			}
		}		
		if(single){
			*ptr=0;
			return ptr;
		}
		cf+=df;
		cr+=dr;		
	}

	if(!b->checkattack) b->mptr->invalid=1;
	*ptr=0;
	return ptr;
}

str pseudoLegalMovesForPieceAt(Board *b,Piece p,uint8_t f,uint8_t r,str ptr){	
	Move* oldmptr=b->mptr;
	if(p.kind=='p'){
		Square sq=(Square){f,r};
		Square pdir=pawnDirection(b,p.color);
		Square advanceOneSq=plusSquare(sq,pdir);
		Square advanceTwoSq=plusSquare(advanceOneSq,pdir);
		// pawn pushes
		if((!b->checkattack)&&isSquareValid(b,advanceOneSq)){
			if(isSquareEmpty(b,advanceOneSq)){
				// pawn push by one
				defaultMove(b);
				b->mptr->fsq=sq;
				b->mptr->tsq=advanceOneSq;
				b->mptr->pawnmove=1;
				b->mptr->pawnpush=1;
				if(isSquareValid(b,advanceTwoSq)){
					// normal push
					recordMove(b);	
				} else {
					// promotion push
					b->mptr->promotion=1;
					recordPromotionMove(b);
				}				
				Square backonesquare=minusSquare(sq,pdir);
				if(isSquareValid(b,backonesquare)){
					Square backtwosquares=minusSquare(backonesquare,pdir);
					if(!isSquareValid(b,backtwosquares)){						
						if(isSquareValid(b,advanceTwoSq)){
							if(isSquareEmpty(b,advanceTwoSq)){
								// pawn push by two
								defaultMove(b);
								b->mptr->fsq=sq;
								b->mptr->tsq=advanceTwoSq;
								b->mptr->pawnmove=1;
								b->mptr->pawnpush=1;
								b->mptr->pawnpushbytwo=1;
								b->mptr->epsq=advanceOneSq;
								b->mptr->epclsq=advanceTwoSq;
								recordMove(b);	
							}
						}
					}
				}
			}
		}
		// pawn captures
		for(int dc=-1;dc<=1;dc+=2){
			for(uint8_t ci=0;ci<b->numplayers;ci++) if(
				( b->checkattack && ((ci+'0')!=p.color) )
				||
				( (!b->checkattack) && ((ci+'0')==p.color) )
			)
			{
				uint8_t effcolor=ci+'0';
				pdir=pawnDirection(b,effcolor);
				Square epdir=effectiveDirection(pdir,dc);
				Square capsq=((b->checkattack)?minusSquare(sq,epdir):plusSquare(sq,epdir));
				if(
					(b->checkattack && isSameColorAtSquare(b,capsq,effcolor))
					||
					((!b->checkattack)&&isDifferentColorAtSquare(b,capsq,p.color))
				){
					// pawn capture
					if((b->checkattack)&&(pieceAtSquare(b,capsq).kind=='p')){
						b->isattack=1;
						*ptr=0;
						return ptr;
					}
					if(!b->checkattack){
						defaultMove(b);
						b->mptr->fsq=sq;
						b->mptr->tsq=capsq;
						b->mptr->pawnmove=1;
						b->mptr->capture=1;
						Square capaheadsq=plusSquare(capsq,pdir);
						if(isSquareValid(b,capaheadsq)){
							// normal capture
							recordMove(b);		
						} else {
							// promotion capture
							b->mptr->promotion=1;
							recordPromotionMove(b);
						}				
					}
				} else if((!b->checkattack)&&hasEpSquare(b,capsq)){
					// ep capture
					Square epclsq=minusSquare(capsq,pdir);
					if(isDifferentColorAtSquare(b,epclsq,p.color)){
						defaultMove(b);
						b->mptr->fsq=sq;
						b->mptr->tsq=capsq;
						b->mptr->pawnmove=1;
						b->mptr->capture=1;
						b->mptr->epcapture=1;
						b->mptr->epsq=capsq;
						b->mptr->epclsq=capsq;
						recordMove(b);
					}
				}
			}
		}
	} else {
		if(p.kind=='n'){			
			for(int df=-2;df<=2;df++){
				for(int dr=-2;dr<=2;dr++){
					if(absv(df*dr)==2){												
						ptr=pseudoLegalVectorMovesForPieceAt(b,df,dr,1,p,f,r,ptr);
						if((b->checkattack)&&(b->isattack)){
							*ptr=0;
							return ptr;
						}						
					}
				}
			}
		} else {
			for(int df=-1;df<=1;df++){
				for(int dr=-1;dr<=1;dr++){
					uint8_t vectdiagonal=(absv(df*dr)==1);
					uint8_t vectstraight=((absv(df)+absv(dr))==1);
					uint8_t single=(p.kind=='k')?1:0;
					uint8_t kind=p.kind;
					uint8_t straight=((kind=='k')||(kind=='r')||(kind=='q'));
					uint8_t diagonal=((kind=='k')||(kind=='b')||(kind=='q'));
					if((straight && vectstraight)||(diagonal && vectdiagonal)){
						ptr=pseudoLegalVectorMovesForPieceAt(b,df,dr,single,p,f,r,ptr);
						if((b->checkattack)&&(b->isattack)){
							*ptr=0;
							return ptr;
						}
					}
				}
			}
		}
	}

	if(!b->checkattack) b->mptr->invalid=1;	
	*ptr=0;
	return ptr;
}

str pseudoLegalMovesForColor(Board *b,uint8_t color,str ptr){	
	b->mptr=(Move*)&movebuff[b->index];
	for(uint8_t f=0;f<b->numfiles;f++){
		for(uint8_t r=0;r<b->numranks;r++){
			Piece p=b->rep[r][f];						
			if((p.kind!='-')&&(p.color==color)){				
				ptr=pseudoLegalMovesForPieceAt(b,p,f,r,ptr);				
			}
		}
	}

	b->mptr->invalid=1;
	return ptr;
}

Move toRichMove(Board* b,Move m){
	Piece prompiece=m.prompiece;
	setDefaultsOnMove(&m);
	m.prompiece=prompiece;
	m.invalid=1; // any premature return should produce an invalid move

	if(!isSquareValid(b,m.fsq)) return m;
	if(!isSquareValid(b,m.tsq)) return m;

	Piece frompiece=pieceAtSquare(b,m.fsq);
	Piece topiece=pieceAtSquare(b,m.tsq);

	if(frompiece.kind=='p'){
		Square pdir=pawnDirection(b,frompiece.color);
		m.pawnmove=1;
		if(topiece.kind=='-'){
			Square vect=minusSquare(m.tsq,m.fsq);
			if((vect.f!=0)&&(vect.r!=0)){
				// ep capture				
				if(!hasEpSquare(b,m.tsq)) return m;
				uint8_t found=0;
				for(int dc=-1;dc<=1;dc+=2){
					Square epdir=effectiveDirection(pdir,dc);
					Square efsq=minusSquare(m.tsq,epdir);
					if(isSquareEqualTo(efsq,m.fsq)){
						found=1;
						break;
					}
				}
				if(!found) return m;
				Square epclsq=minusSquare(m.tsq,pdir);
				if(!isDifferentColorAtSquare(b,epclsq,frompiece.color)) return m;
				m.pawnmove=1;
				m.capture=1;
				m.epcapture=1;
				m.epsq=m.tsq;
				m.epclsq=epclsq;
			} else {
				// pawn push
				m.pawnpush=1;			
				Square behindsq=minusSquare(m.tsq,pdir);
				if(!isSquareValid(b,behindsq)) return m;			
				if(isSquareEqualTo(m.fsq,behindsq)){
					// pawn push by one
				} else {
					// pawn push by two
					if(!isSquareEmpty(b,behindsq)) return m;
					Square behindtwosqs=minusSquare(behindsq,pdir);					
					if(!isSquareEqualTo(m.fsq,behindtwosqs)) return m;
					m.pawnpushbytwo=1;
					m.epsq=behindsq;
					m.epclsq=m.tsq;
				}
			}
		} else {			
			// pawn capture			
			m.capture=1;
			if(topiece.color==frompiece.color) return m;
			uint8_t found=0;
			for(int dc=-1;dc<=1;dc+=2){
				Square epdir=effectiveDirection(pdir,dc);
				Square efsq=minusSquare(m.tsq,epdir);
				if(isSquareEqualTo(efsq,m.fsq)){
					found=1;
					break;
				}
			}
			if(!found) return m;
		}
	} else {
		if(
			(frompiece.kind=='k') &&
			(topiece.kind=='r') &&
			(topiece.color==frompiece.color)
		){
			m.castling=1;
		}
		if(topiece.kind!='-'){
			m.capture=1;
		}
	}

	if(m.prompiece.kind!='-') m.promotion=1;

	m.invalid=0; // move ok
	return m;
}

str moveToSan(Board* b,Move m,str ptr){
	m=toRichMove(b,m);
	if(m.invalid){
		*ptr++='-';
		*ptr=0;
		return ptr;
	}
	Piece frompiece=pieceAtSquare(b,m.fsq);
	if(frompiece.kind=='p'){
		if(m.capture){
			// pawn capture
			Square pdir=pawnDirection(b,frompiece.color);
			if(pdir.r!=0){
				// identify by file
				*ptr++=m.fsq.f+'a';
			} else {
				// identify by rank
				*ptr++=b->lastplayer-m.fsq.r+'1';
			}
			*ptr++='x';			
		} else {
			// pawn push, no specifier needed
		}
		// add target square anyhow
		ptr=squareToAlgeb(b,m.tsq,ptr);		
	} else if(m.castling) {
		// castling
		*ptr++='O';*ptr++='-';*ptr++='O';
		Square pdir=pawnDirection(b,frompiece.color);
		Square cdir=rotateSquare(pdir,1);				
		if(b->variant<FOUR_PLAYER_BASE){
			if(frompiece.color=='0') cdir=rotateSquare(pdir,-1);
		} else cdir=rotateSquare(pdir,-1);
		Square cvect=normalizeSquare(minusSquare(m.tsq,m.fsq));
		if(isSquareEqualTo(cvect,cdir)){
			*ptr++='-';*ptr++='O';
		}
	} else {
		// normal piece move
		Move *oldmptr=b->mptr;
		Move* temp0=(Move*)&tempmovebuff[b->index];
		b->mptr=temp0;
		Piece testpiece=(Piece){frompiece.kind,'z'};				
		b->stm=1;
		ptr=pseudoLegalMovesForPieceAt(b,testpiece,m.tsq.f,m.tsq.r,ptr);		
		b->stm=0;
		b->mptr=temp0;
		int samefile=0;
		int samerank=0;
		int same=0;		
		while(!b->mptr->invalid){			
			uint8_t legal=1;
			// TODO: check legality
			if(legal){
				Piece topiece=pieceAtSquare(b,b->mptr->tsq);						
				if((topiece.kind==frompiece.kind)&&(topiece.color==frompiece.color)){
					same++;
					if(b->mptr->tsq.f==m.fsq.f){
						samefile++;					
					}
					if(b->mptr->tsq.r==m.fsq.r){
						samerank++;
					}
				}
			}
			b->mptr++;
		}
		*ptr++=frompiece.kind+'A'-'a';
		if(same>1){
			if(samefile<=1){
				*ptr++=m.fsq.f+'a';
			} else if(samerank<=1){
				*ptr++=b->lastrank-m.fsq.r+'1';
			} else {
				*ptr++=m.fsq.f+'a';
				*ptr++=b->lastrank-m.fsq.r+'1';
			}
		}
		if(m.capture){
			*ptr++='x';
		}
		ptr=squareToAlgeb(b,m.tsq,ptr);
		b->mptr=oldmptr;
	}
	if(m.promotion){
		*ptr++='=';
		*ptr++=m.prompiece.kind+'A'-'a';
	}
	*ptr=0;
	return ptr;
}

int castleSideLetterToIndex(Board* b,uint8_t sideletter){
	if(b->variant<FOUR_PLAYER_BASE){
		if(b->turn=='0') return (sideletter=='s')?0:1;
		else return (sideletter=='s')?1:0;
	} else {
		return (sideletter=='s')?0:1;
	}	
}

str sanToMove(Board* b,str san,str ptr){	
	setDefaultsOnMove(&b->sanm);
	b->sanm.invalid=1;

	Tokenizer tinst;
	Tokenizer* t=&tinst;
	t->b=b;
	t->cptr=san;

	pullCastling(t);
	if(t->castling!='-'){
		int cs=castleSideLetterToIndex(b,t->castling);
		CastlingRegistry cr=b->castregs[b->turn-'0'][cs];
		b->sanm.fsq=cr.kingsq;
		b->sanm.tsq=cr.rooksq;
		b->sanm.invalid=0;
		*ptr=0;
		return ptr;
	}

	pullKind(t);
	uint8_t kind=t->kind;
	if(kind=='-') kind='p';
	pullSquare(t);
	Square sq1=t->sq;
	pullSquare(t);
	Square sq2=t->sq;
	pullPromPiece(t);
	uint8_t promkind=t->kind;	
	Square fsq=sq1;
	Square tsq=sq2;
	if((tsq.f<0)&&(tsq.r<0)){
		tsq=sq1;
		fsq.f=-1;
		fsq.r=-1;
	}	
	b->sanm.tsq=tsq;
	if(promkind!='-'){		
		b->sanm.prompiece=(Piece){promkind,b->turn};
	}
	if(!isSquareValid(b,tsq)){
		*ptr=0;
		return ptr;
	}
	Piece topiece=pieceAtSquare(b,tsq);
	if(kind=='p'){		
		Square pdir=pawnDirection(b,b->turn);
		for(int dc=-1;dc<=1;dc++){
			Square epdir=effectiveDirection(pdir,dc);
			Square testsq=minusSquare(tsq,epdir);
			if(isSquareValid(b,testsq))
			if(isSquareRoughlyEqualTo(testsq,fsq)){				
				Piece testp=pieceAtSquare(b,testsq);
				if((testp.kind=='p')&&(testp.color==b->turn)){					
					if(
						((dc!=0)&&(topiece.kind!='-'))
						||
						((dc==0)&&(topiece.kind='-'))
					){
						b->sanm.fsq=testsq;
						b->sanm.invalid=0;
						*ptr=0;
						return ptr;	
					}
				}				
			}
			if(dc==0){
				testsq=minusSquare(testsq,pdir);
				if(isSquareValid(b,testsq))
				if(isSquareRoughlyEqualTo(testsq,fsq)){
					Piece testp=pieceAtSquare(b,testsq);
					if((testp.kind=='p')&&(testp.color==b->turn)){
						b->sanm.fsq=testsq;
						b->sanm.invalid=0;
						*ptr=0;
						return ptr;	
					}				
				}
			}
		}
	} else {
		Move *oldmptr=b->mptr;
		Move* temp0=(Move*)&tempmovebuff[b->index];
		b->mptr=temp0;
		Piece testpiece=(Piece){kind,'z'};				
		b->stm=1;
		ptr=pseudoLegalMovesForPieceAt(b,testpiece,tsq.f,tsq.r,ptr);		
		b->stm=0;
		b->mptr=temp0;		
		while(!b->mptr->invalid){						
			Square testtsq=b->mptr->tsq;
			Piece testtopiece=pieceAtSquare(b,testtsq);						
			if((testtopiece.kind==kind)&&(testtopiece.color==b->turn)){
				b->sanm.fsq=testtsq;
				b->mptr=oldmptr;
				b->sanm.invalid=0;
				*ptr=0;
				return ptr;
			}
			b->mptr++;
		}
		b->mptr=oldmptr;
	}
	*ptr=0;
	return ptr;
}

str reportMoveList(Board* b,str ptr,uint8_t detail,uint8_t reverse){
	uint8_t first=1;

	b->mptr=(Move*)&legalmovebuff[b->index];	

	while(!(b->mptr->invalid)){		
		if(first){			
			first=0;
		} else {
			*ptr++=' ';
		}
		uint8_t* san=ptr;
		ptr=moveToSan(b,*b->mptr,ptr);
		if(reverse){
			ptr=sanToMove(b,san,ptr);
			if(!b->sanm.invalid){
				Move rm=toRichMove(b,b->sanm);
				*ptr++=' ';
				*ptr++='$';
				*ptr++=' ';			
				ptr=moveToAlgeb(b,rm,1,ptr);
			}
		}
		*ptr++=';';
		b->mptr++;
	}

	*ptr=0;
	return ptr;
}

str reportBoardRep(int i,str ptr){
	Board *b=&boards[i];

	for(int r=0;r<b->numranks;r++){
		for(int f=0;f<b->numfiles;f++)
		{
			Piece p=b->rep[r][f];
			*ptr++=p.kind;
			*ptr++=p.color;			
		}
		*ptr++='\n';
	}

	*ptr++='t';*ptr++=':';*ptr++=b->turn;*ptr++=' ';
	*ptr++='f';*ptr++=':';ptr=printNumber(b->fullmove_number,ptr);*ptr++=' ';
	*ptr++='h';*ptr++=':';ptr=printNumber(b->halfmove_clock,ptr);*ptr++=' ';

	*ptr++='\n';

	*ptr=0;
	return ptr;
}

str reportGame(int i,str ptr){
	Board *b=&boards[i];

	GameNode* current=b->root;

	do{
		current=getlastsibling(current);
		if(current!=0){
			ptr=moveToAlgeb(b,current->genmove,0,ptr);
			if(current==b->current){
				*ptr++='*';
			}
			*ptr++=' ';
			*ptr++='>';
			*ptr++=' ';
		}
	} while(current!=0);
	
	*ptr++='\n';

	return ptr;
}

void setFromRawFen(int i){
	Board *b=&boards[i];

	str fen=INBUF;

	for(int r=0;r<b->numranks;r++)
	{
		for(int f=0;f<b->numfiles;f++)
		{
			b->rep[r][f].kind=*fen++;
			b->rep[r][f].color=*fen++;
		}
	}

	str ptr=OUTBUF2;

	*ptr++='r';
	*ptr++='f';

	*ptr=0;
}

void advanceClocks(Board* b,Move m){
	if(m.capture||m.pawnmove) b->halfmove_clock=0; else b->halfmove_clock++;
	if(b->turn=='1') b->fullmove_number++;
}

void makeMoveInner(Board* b,Move m){
	str ptr=OUTBUF2;

	if(!b->test){
	/////////////////////////////////////////////////////////////////
	// save board state before making move
	_memcpy((uint8_t*)b,(uint8_t*)&b->current->b,sizeof(Board));
	/////////////////////////////////////////////////////////////////
	}

	if(!b->test){
		*ptr++='m';
		*ptr++=':';
	}

	m=toRichMove(b,m);

	if(m.invalid) return;

	if(!b->test){
		ptr=moveToAlgeb(b,m,1,ptr);	
		*ptr=0;
	}

	uint8_t ff=m.fsq.f;
	uint8_t fr=m.fsq.r;
	uint8_t tf=m.tsq.f;
	uint8_t tr=m.tsq.r;

	Piece frompiece=b->rep[fr][ff];
	Piece topiece=b->rep[tr][tf];

	b->rep[fr][ff].kind='-';
	b->rep[fr][ff].color='0';

	if(m.castling){				
		for(int cs=0;cs<MAX_CASTLING_SIDES;cs++){
			CastlingRegistry cr=b->castregs[b->turn-'0'][cs];						
			if(isSquareEqualTo(m.tsq,cr.rooksq)){
				b->rep[cr.rooksq.r][cr.rooksq.f]=(Piece){'-','0'};
				Square pdir=pawnDirection(b,b->turn);
				Square cdir=rotateSquare(pdir,cs==0?1:-1);
				Square rookto=plusSquare(m.fsq,cdir);
				Square kingto=plusSquare(rookto,cdir);
				b->rep[rookto.r][rookto.f]=(Piece){'r',b->turn};
				b->rep[kingto.r][kingto.f]=(Piece){'k',b->turn};
				break;
			}
		}
	} else {
		b->rep[tr][tf].kind=frompiece.kind;
		b->rep[tr][tf].color=frompiece.color;
	}

	for(int ci=0;ci<b->numplayers;ci++)
	for(int cs=0;cs<MAX_CASTLING_SIDES;cs++){
		CastlingRegistry cr=b->castregs[ci][cs];
		if(cr.right){
			Piece kp=pieceAtSquare(b,cr.kingsq);
			Piece rp=pieceAtSquare(b,cr.rooksq);
			uint8_t color=ci+'0';
			if(
				kp.kind!='k' ||
				kp.color!=color ||
				rp.kind!='r' ||
				rp.color!=color
			) b->castregs[ci][cs].right=0;
		}
	}

	if(m.promotion){
		b->rep[tr][tf].kind=m.prompiece.kind;
		b->rep[tr][tf].color=m.prompiece.color;
	}

	if(m.pawnpushbytwo){
		int colindex=frompiece.color-'0';
		b->epsqs[colindex].epsq=m.epsq;
		b->epsqs[colindex].epclsq=m.epclsq;
		b->epsqs[colindex].cnt=b->numplayers;
	}

	for(int ei=0;ei<b->numplayers;ei++){
		if(b->epsqs[ei].cnt>0) b->epsqs[ei].cnt--;
	}

	advanceTurn(b);

	advanceClocks(b,m);

	if(!b->test){
	/////////////////////////////////////////////////////////////////
	// create gamenode
	GameNode* movenode=getmovenode(b->current,m);
	if(movenode==0){				
		if(b->current->child!=0) freeallchilds(b->current->child);
		b->current->child=0;

		GameNode* child=allocate_gamenode();
		if(child==0) return; // out of memory

		GameNode* ls=getlastsibling(b->current);

		if(b->current->child==0){
			b->current->child=child;
		}

		child->genmove=m;
		child->parent=b->current;
		child->child=0;		

		child->prevsibling=ls;
		if(ls!=0){
			ls->nextsibling=child;
		}
		child->nextsibling=0;

		b->current=child;

		// save board state in new node
		_memcpy((uint8_t*)b,(uint8_t*)&child->b,sizeof(Board));
	} else {
		b->current=movenode;
	}
	/////////////////////////////////////////////////////////////////
	}
}

void makeMove(uint8_t i,uint8_t ff,uint8_t fr,uint8_t tf,uint8_t tr,uint8_t pk,uint8_t pc){
	Board *b=&boards[i];
	Move m;
	m.fsq=(Square){ff,fr};
	m.tsq=(Square){tf,tr};
	m.prompiece=(Piece){pk,pc};
	makeMoveInner(b,m);
}

uint8_t isSquareAttacked(Board* b,Square sq,uint8_t color){
	uint8_t* pptr=allPieceKinds(b);
	while(*pptr!=0){
		Piece testpiece=(Piece){*pptr,color};
		b->isattack=0;		
		b->checkattack=1;
		pseudoLegalMovesForPieceAt(b,testpiece,sq.f,sq.r,0);
		b->checkattack=0;
		if(b->isattack) return 1;
		pptr++;
	}
	return 0;
}

Square whereIsKing(Board* b,uint8_t color){
	for(uint8_t f=0;f<b->numfiles;f++) for(uint8_t r=0;r<b->numranks;r++)
		if((b->rep[r][f].kind=='k')&&(b->rep[r][f].color==color)) return (Square){f,r};
	return (Square){-1,-1};
}

uint8_t isInCheck(Board* b,uint8_t color){
	Square wk=whereIsKing(b,color);
	if((wk.f<0)||(wk.r<0)) return 1;	
	return isSquareAttacked(b,wk,color);
}

str legalMovesForColor(Board *b,uint8_t color,str ptr){
	ptr=pseudoLegalMovesForColor(b,color,ptr);
	b->mptr=(Move*)&movebuff[b->index];
	Move* lptr=(Move*)&legalmovebuff[b->index];
	while(!b->mptr->invalid){		
		Board testb;
		_memcpy((uint8_t*)b,(uint8_t*)&testb,sizeof(Board));
		testb.test=1;
		makeMoveInner(&testb,*b->mptr);
		if(!isInCheck(&testb,color)){
			_memcpy((uint8_t*)b->mptr,(uint8_t*)lptr,sizeof(Move));
			lptr++;
		}
		b->mptr++;
	}
	for(int cs=0;cs<MAX_CASTLING_SIDES;cs++){
		CastlingRegistry cr=b->castregs[color-'0'][cs];
		if(cr.right){
			uint8_t rightok=1;
			int ei=0;
			while((cr.emptysqs[ei].f>=0)&&(cr.emptysqs[ei].r>=0)){				
				if(!isSquareEmpty(b,cr.emptysqs[ei])){
					rightok=0;
					break;
				}
				ei++;
			}
			int pi=0;
			if(rightok) while((cr.passingsqs[pi].f>=0)&&(cr.passingsqs[pi].r>=0)){
				if(isSquareAttacked(b,cr.passingsqs[pi],color)){
					rightok=0;
					break;
				}
				pi++;
			}
			if(rightok){
				Move m;
				setDefaultsOnMove(&m);				
				m.fsq=cr.kingsq;
				m.tsq=cr.rooksq;
				m.castling=1;
				m.invalid=0;
				*lptr=m;				
				lptr++;
			}
		}
	}
	lptr->invalid=1;
	*ptr=0;
	return ptr;
}

void reportBoardText(int i){	
	str ptr=OUTBUF;

	ptr=reportBoardRep(i,ptr);

	Board *b=&boards[i];

	for(int color=0;color<b->numplayers;color++){		
		ptr=printNumber(color,ptr);
		*ptr++=':';
		if(b->epsqs[color].cnt){
			*ptr++='e';
			*ptr++='=';
			ptr=squareToAlgeb(b,b->epsqs[color].epsq,ptr);
			*ptr++=':';
		}
		for(int cs=0;cs<MAX_CASTLING_SIDES;cs++){
			if(b->castregs[color][cs].right){
				*ptr++='c';
				*ptr++='0'+cs;
				*ptr++='|';
			}
		}
		ptr=legalMovesForColor(b,'0'+color,ptr);
		ptr=reportMoveList(b,ptr,1,('0'+color)==b->turn);
		*ptr++='\n';
	}

	ptr=reportGame(i,ptr);

	*ptr=0;
}

void sortedLegalSanList(Board* b){
	str ptr=OUTBUF;

	legalMovesForColor(b,b->turn,ptr);

	b->mptr=(Move*)&legalmovebuff[b->index];	

	ExtendedMove* emptr0=(ExtendedMove*)&extendedmovebuff[b->index];	

	ExtendedMove* emptr=emptr0;

	while(!(b->mptr->invalid)){
		_memcpy((uint8_t*)b->mptr,(uint8_t*)&emptr->m,sizeof(Move));		
		moveToSan(b,*b->mptr,(uint8_t*)&emptr->san);		
		b->mptr++;
		emptr++;
	}	

	emptr->m.invalid=1;

	int sortstart=0;	

	
	while(!((emptr0+sortstart)->m.invalid)){		
		int ci=0;		
		while(!((emptr0+ci+sortstart+1)->m.invalid)){
			ExtendedMove* em1=emptr0+ci;
			ExtendedMove* em2=emptr0+ci+1;						
			if(
				(em1->san[0]>em2->san[0])
				||
				((em1->san[0]!='O')&&(em2->san[0]=='O'))
			){
				_swap((uint8_t*)em1,(uint8_t*)em2,sizeof(ExtendedMove));
			} else if(
				(em1->san[0]==em2->san[0])
				&&
				(em1->m.capture>em2->m.capture)
				){
				_swap((uint8_t*)em1,(uint8_t*)em2,sizeof(ExtendedMove));
			}
			ci++;
		}
		sortstart++;
	}

	emptr=emptr0;	

	while(!(emptr->m.invalid)){
		ptr=_strcpys((str)&emptr->san,ptr,MAX_SAN_LENGTH);
		*ptr++='\n';
		emptr++;		
	}

	*ptr=0;
}

void sortedLegalSanListI(int i){
	sortedLegalSanList(getBoardI(i));
}

void deleteGameInfo(Board* b){
	freeallchilds(b->root);
	b->root->child=0;	
	b->current=b->root;	
}

void deleteGameInfoI(int i){
	Board *b=getBoardI(i);	

	deleteGameInfo(b);
}

void back(Board* b){
	GameNode* parent=b->current->parent;
	if(parent!=0){
		b->current=parent;
		_memcpy((uint8_t*)b,(uint8_t*)&b->current->b,sizeof(Board));
	}
}

void backI(int i){
	Board *b=getBoardI(i);	

	back(b);
}

void forward(Board* b){
	GameNode* lastsibling=getlastsibling(b->current);
	if(lastsibling!=0){
		b->current=lastsibling;
		_memcpy((uint8_t*)b,(uint8_t*)&b->current->b,sizeof(Board));
	}
}

void forwardI(int i){
	Board *b=getBoardI(i);	

	forward(b);
}

void delete(Board* b){
	freeallchilds(b->current);
	back(b);
	b->current->child=0;
}

void deleteI(int i){
	Board *b=getBoardI(i);	

	delete(b);
}

void tobegin(Board* b){
	b->current=b->root;
}

void tobeginI(int i){
	Board *b=getBoardI(i);	

	tobegin(b);
}

void toend(Board* b){	
	while(getlastsibling(b->current)!=0){
		b->current=getlastsibling(b->current);
	}
}

void toendI(int i){
	Board *b=getBoardI(i);	

	toend(b);
}