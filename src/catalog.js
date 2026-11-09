const palettes = {
 water:['#7dd8d4','#207f93','#ffe7b9'],garden:['#a9d498','#497b5b','#ffe7ae'],
 cosmic:['#6861ac','#242a57','#f6d6ff'],mineral:['#d9c997','#938264','#fff2c9'],
 ember:['#e99c86','#914e67','#ffdb9b'],sand:['#d9b991','#91785f','#ffe6b7'],
};
const make=(id,name,en,mode,desc,colors)=>({id,name,en,mode,desc,colors:colors||palettes[mode]});
export const collections=[
 {id:'landscape',name:'地理秘境',en:'LANDSCAPES',items:[
  make('stream','浮光溪流','Glimmering stream','water','把游鱼、水光与细碎亮片，封进透明胶带。'),
  make('garden','春日花园','A garden unfurls','garden','花瓣与枝叶贴合薄膜，在一卷胶带里留住春天。'),
  make('coast','贝壳海岸','Pearl coast','water','海盐色的水面，像被阳光揉碎的珍珠。',['#a4dfdf','#4c9da9','#ffedcf']),
  make('forest','苔藓森林','Moss sanctuary','garden','深绿苔色与疏落的小花，留一段安静的森林。',['#82a89c','#375e57','#e5dbaf']),
  make('glacier','蓝色冰川','Blue glacier','mineral','透亮的冰蓝晶体，映着银白色细闪。',['#c4eafa','#7ea6c7','#f0fbff']),
  make('desert','日落沙丘','Dunes at dusk','sand','细沙的纹路与暖金色的光。'),
  make('volcano','熔岩山谷','Lava valley','ember','柔软的余烬红，流动的金橙光。'),
  make('night','极夜之境','Polar night','cosmic','把极夜的紫蓝微光，折进一段胶带。')
 ]},
 {id:'elements',name:'东方五行',en:'FIVE ELEMENTS',items:[
  make('metal','金 · 碎金','Metal','mineral','香槟金矿晶与细碎金箔。'),
  make('wood','木 · 生息','Wood','garden','青苔、花芽与向上生长的绿。'),
  make('water','水 · 流光','Water','water','青蓝水纹与慢慢游过的锦鲤。'),
  make('fire','火 · 余烬','Fire','ember','珊瑚红火光与散落的金色细闪。'),
  make('earth','土 · 岩层','Earth','sand','赭石、细沙与温暖的层理。')
 ]},
 {id:'mbti',name:'16 型灵感',en:'PERSONALITY PALETTES',note:'由人格代号联想的创作主题，不是人格测评。',items:[
  ['INTJ','星图建筑师','cosmic'],['INTP','漂浮实验室','mineral'],['ENTJ','鎏金轨道','mineral'],['ENTP','电光火花','ember'],
  ['INFJ','月下花园','garden'],['INFP','梦游森林','garden'],['ENFJ','暖光温室','garden'],['ENFP','彩色流星','cosmic'],
  ['ISTJ','大地切片','sand'],['ISFJ','晨露小径','garden'],['ESTJ','金色脉络','mineral'],['ESFJ','春日聚会','garden'],
  ['ISTP','冰蓝机械','mineral'],['ISFP','海边画室','water'],['ESTP','熔岩冲浪','ember'],['ESFP','闪耀舞池','cosmic'],
 ].map(([id,n,m],i)=>make(id,`${id} · ${n}`,id,m,'一种属于你的配色联想，也可以自由改写。',i%2?[palettes[m][0],palettes[m][1],['#ffc8d9','#d7f2d2','#fff1b7'][i%3]]:undefined))},
 {id:'zodiac',name:'十二星座',en:'ZODIAC',items:[
  ['白羊','ember'],['金牛','garden'],['双子','cosmic'],['巨蟹','water'],['狮子','mineral'],['处女','garden'],['天秤','mineral'],['天蝎','cosmic'],['射手','ember'],['摩羯','sand'],['水瓶','water'],['双鱼','water']
 ].map(([n,m],i)=>make('zodiac-'+i,n+'座',`Constellation ${String(i+1).padStart(2,'0')}`,m,'把星座的联想变成自己的色彩；自由调色，不设性格限制。'))},
 {id:'planets',name:'行星漫游',en:'PLANETARY',items:[
  ['水星','mineral',['#b9bcc6','#6e7286','#f3e7da']],['金星','sand',['#e9c68a','#b08253','#fff5d2']],
  ['地球','water',['#72ced6','#286aa2','#c4eec9']],['火星','ember',['#ce8d76','#954c48','#f1cc96']],
  ['木星','sand',['#dbbaa2','#9e6e65','#f5d5b1']],['土星','cosmic',['#ccb88c','#7b657f','#ffedb8']],
  ['天王星','cosmic',['#a6e0e3','#5b9eae','#f0fbef']],['海王星','cosmic',['#6b94e5','#283b8e','#b5e4ff']]
 ].map(([n,m,c],i)=>make('planet-'+i,n,`Planet ${String(i+1).padStart(2,'0')}`,m,'灵感来自行星的色彩与轨道，做一卷自己的微型宇宙。',c))},
 {id:'flowers',name:'花间来信',en:'BOTANICAL',note:'八种独立花型，图案封存在透明薄膜内。',items:[
  ['雏菊',['#afd69c','#477c58','#ffdf8f']],['樱花',['#edc8db','#af7296','#fff0d6']],
  ['玫瑰',['#d8a8bb','#984c6d','#f9ddd5']],['薰衣草',['#bdb1de','#776295','#e9dcfa']],
  ['绣球',['#b4cce5','#6d82af','#ebd4f4']],['向日葵',['#e7cf87','#aa8441','#fff2a9']],
  ['山茶',['#c7d5bd','#5f806d','#f7dcd8']],['铃兰',['#c6dec8','#6a9a84','#f1f4db']]
 ].map(([n,c],i)=>make('flower-'+i,n,`Botanical ${String(i+1).padStart(2,'0')}`,'garden','从花的颜色出发，调出属于自己的春天。',c))},
 {id:'blank',name:'空白创作',en:'YOUR OWN WORLD',items:[make('blank','留白，给想象','An unwritten world','blank','画一笔，贴一朵花，或者带上你自己的图案。',['#e9ded2','#b5a0af','#ffdfb2'])]},
];
export const allThemes=collections.flatMap(c=>c.items);

// Indices into the original 6×6 motif atlas; -1 means animated koi.
export function motifFor(id){
 if(id==='blank')return [];
 if(id.startsWith('flower-'))return [Number(id.split('-')[1])];
 if(id.startsWith('planet-'))return [12+Number(id.split('-')[1])];
 if(id.startsWith('zodiac-'))return [24+Number(id.split('-')[1])];
 const motifs={stream:[-1],water:[-1],garden:[0,1,7],coast:[9],forest:[8,7],glacier:[21,10],desert:[22],volcano:[11],night:[20,19],metal:[23,10],wood:[8,6],fire:[11,23],earth:[22,10],INTJ:[20,19],INTP:[10,18],ENTJ:[23,17],ENTP:[11,10],INFJ:[20,6],INFP:[8,1],ENFJ:[0,5],ENFP:[18,19,20],ISTJ:[22,10],ISFJ:[7,0],ESTJ:[23,10],ESFJ:[1,4],ISTP:[10,12],ISFP:[9,4],ESTP:[11,9],ESFP:[17,23,19]};
 return motifs[id]||[0];
}
