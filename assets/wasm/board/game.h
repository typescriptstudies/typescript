#ifndef GAME_H

#define GAME_H

#include "types.h"
#include "utils.h"
#include "boardutils.h"

#define MAX_GAMENODES 500

extern uint8_t game_initialized;

extern GameNode root_gamenodes[MAX_BOARDS];
extern GameNode gamenodes[MAX_GAMENODES];
extern GameNode* gamenodeslist[MAX_GAMENODES+1];

extern void init_game();
extern GameNode* allocate_gamenode();
extern GameNode* getmovenode(GameNode* gn,Move m);
extern GameNode* getlastsibling(GameNode* gn);
extern GameNode** allchilds(GameNode* gn);
extern void freeallchilds(GameNode* gn);

#endif