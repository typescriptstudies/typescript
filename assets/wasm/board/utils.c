#include "types.h"
#include "utils.h"

// global constants

const int VARIANT_STANDARD = 201;
const int VARIANT_ATOMIC = 202;
const int VARIANT_FOUR_PLAYER = 401;
const int FOUR_PLAYER_BASE = 400;

// global data structures

uint8_t buff[NUM_STR_BUFFERS][STR_BUFFER_LENGTH];
Board boards[MAX_BOARDS];
Move movebuff[MAX_BOARDS][MAX_MOVES];
Move legalmovebuff[MAX_BOARDS][MAX_MOVES];
Move tempmovebuff[MAX_BOARDS][MAX_MOVES];
ExtendedMove extendedmovebuff[MAX_BOARDS][MAX_MOVES];

str logptr;


// general utility functions

uint64_t addr(int buffer_index){
	return (uint64_t)&buff[buffer_index];
}

uint64_t getNumStrBuffers(){
	return NUM_STR_BUFFERS;
}

uint64_t getStrBufferLength(){
	return STR_BUFFER_LENGTH;
}

str printNumber(int number,str ptr){
	uint8_t digits[50];
	int di=0;
	if(number<0){
		*ptr++='-';
		number=-number;
	}
	do{
		int digit=number%10;
		digits[di++]='0'+digit;
		number=number/10;
	} while(number>0);
	while(di-->0){
		*ptr++=digits[di];
	}
	*ptr=0;
	return ptr;
}

void toCase(uint64_t _case){
	uint8_t* ptr0=INBUF;
	uint8_t* ptr=ptr0;	
	uint8_t* out0=OUTBUF;
	uint8_t* out;
	while(((ptr-ptr0)<STR_BUFFER_LENGTH)&&((*ptr)!=0)){
		uint8_t c=*ptr;
		out=ptr-ptr0+out0;
		if((_case==1)&&(c>='a')&&(c<='z')) *out=c+'A'-'a';
		else if((_case==0)&&(c>='A')&&(c<='Z')) *out=c+'a'-'A';
		else *out=c;
		ptr++;
	}
	*(ptr-ptr0+out0)=0;
}

int absv(int x){
	if(x>=0) return x;
	return -x;
}

void _memcpy(uint8_t* from,uint8_t* to,int size){
	for(int i=0;i<size;i++){
		*(to+i)=*(from+i);
	}
}

str _strcpys(str from,str to,int size){
	int i;
	for(i=0;i<size;i++){
		*(to+i)=*(from+i);
		if(*(from+i)==0) return to+i;
	}	
	*(to+i)=0;
	return to+i;
}

uint8_t swapbuff[MAX_STRUCT_SIZE];

void _swap(uint8_t* p1,uint8_t* p2,int size){
	_memcpy(p1,(uint8_t*)&swapbuff,size);
	_memcpy(p2,p1,size);
	_memcpy((uint8_t*)&swapbuff,p2,size);
}

void startlog(){
	logptr=OUTBUF3;
}

void lognum(int n){
	logptr=printNumber(n,logptr);
}

void logchar(uint8_t c){
	*logptr++=c;
	*logptr=0;
}

void logstr(uint8_t* s){
	while(*s!=0){
		*logptr++=*s++;
	}
	*logptr=0;
}