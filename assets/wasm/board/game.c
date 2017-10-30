#include "game.h"

uint8_t game_initialized=0;

GameNode root_gamenodes[MAX_BOARDS];
GameNode gamenodes[MAX_GAMENODES];
GameNode* gamenodeslist[MAX_GAMENODES+1];

void init_game(){
	for(int i=0;i<MAX_GAMENODES;i++){
		gamenodes[i].free=1;
	}
	game_initialized=1;
}

extern GameNode* allocate_gamenode(){
	for(int i=0;i<MAX_GAMENODES;i++){
		if(gamenodes[i].free){
			gamenodes[i].free=0;
			return &gamenodes[i];
		}
	}
	return 0;
}

GameNode* getmovenode(GameNode* gn,Move m){
	if(gn->child==0) return 0;
	GameNode* search=gn->child;
	while(search!=0){
		if(isMoveRoughlyEqualTo(search->genmove,m)){
			return search;
		}
		search=search->nextsibling;
	}
	return 0;
}

GameNode* getlastsibling(GameNode* gn){	
	if(gn->child==0) return 0;
	GameNode* search=gn->child;
	while(search->nextsibling!=0){		
		search=search->nextsibling;
	};
	return search;
}

GameNode** allchildsrecursive(GameNode* gn,GameNode** gptr){			
	if(gn==0) return gptr;
	do{	
		*gptr++=gn;				
		gptr=allchildsrecursive(gn->child,gptr);
		gn=gn->nextsibling;			
	} while(gn!=0);
	return gptr;
}

GameNode** allchilds(GameNode* gn){
	GameNode** gptr=allchildsrecursive(gn,gamenodeslist);

	*gptr=0;

	return gamenodeslist;
}

void freeallchilds(GameNode* gn){
	GameNode** gptr=allchilds(gn);

	while(*gptr!=0){
		(*gptr)->free=1;

		gptr++;
	}
}