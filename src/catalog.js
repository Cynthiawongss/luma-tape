const palettes = {
 water:['#7dd8d4','#207f93','#ffe7b9'],garden:['#a9d498','#497b5b','#ffe7ae'],
 cosmic:['#6861ac','#242a57','#f6d6ff'],mineral:['#d9c997','#938264','#fff2c9'],
 ember:['#e99c86','#914e67','#ffdb9b'],sand:['#d9b991','#91785f','#ffe6b7'],
};
const make=(id,name,en,mode,desc,colors)=>({id,name,en,mode,desc,colors:colors||palettes[mode]});
export const collections=[
 {id:'landscape',name:'地理秘境',short:'场景',en:'Landscapes',tab:'Places',items:[
  make('stream','浮光溪流','Koi Stream','water','把游鱼、水光与细碎亮片，封进透明胶带。'),
  make('garden','春日花园','Spring Garden','garden','花瓣与枝叶贴合薄膜，在一卷胶带里留住春天。'),
  make('coast','贝壳海岸','Pearl Coast','water','海盐色的水面，像被阳光揉碎的珍珠。',['#a4dfdf','#4c9da9','#ffedcf']),
  make('forest','苔藓森林','Moss Sanctuary','garden','深绿苔色与疏落的小花，留一段安静的森林。',['#82a89c','#375e57','#e5dbaf']),
  make('glacier','蓝色冰川','Blue Glacier','mineral','透亮的冰蓝晶体，映着银白色细闪。',['#c4eafa','#7ea6c7','#f0fbff']),
  make('desert','日落沙丘','Dunes at Dusk','sand','细沙的纹路与暖金色的光。'),
  make('volcano','熔岩山谷','Lava Valley','ember','柔软的余烬红，流动的金橙光。'),
  make('night','极夜之境','Polar Night','cosmic','把极夜的紫蓝微光，折进一段胶带。')
 ]},
 {id:'elements',name:'东方五行',short:'五行',en:'Five Elements',tab:'Elements',items:[
  make('metal','金 · 碎金','Gold Leaf','mineral','香槟金矿晶与细碎金箔。'),
  make('wood','木 · 生息','Green Shoots','garden','青苔、花芽与向上生长的绿。'),
  make('water','水 · 流光','Flowing Water','water','青蓝水纹与慢慢游过的锦鲤。'),
  make('fire','火 · 余烬','Embers','ember','珊瑚红火光与散落的金色细闪。'),
  make('earth','土 · 岩层','Strata','sand','赭石、细沙与温暖的层理。')
 ]},
 {id:'mbti',name:'16 型灵感',short:'MBTI',en:'Personality Palettes',tab:'MBTI',note:'Mood boards inspired by the four letters. Not a personality test.',items:[
  ['INTJ','星图建筑师','cosmic','Star Architect'],['INTP','漂浮实验室','mineral','Floating Lab'],['ENTJ','鎏金轨道','mineral','Gilded Orbit'],['ENTP','电光火花','ember','Electric Spark'],
  ['INFJ','月下花园','garden','Moonlit Garden'],['INFP','梦游森林','garden','Dreamwalk Forest'],['ENFJ','暖光温室','garden','Warm Greenhouse'],['ENFP','彩色流星','cosmic','Rainbow Meteor'],
  ['ISTJ','大地切片','sand','Earth Section'],['ISFJ','晨露小径','garden','Dewy Path'],['ESTJ','金色脉络','mineral','Golden Veins'],['ESFJ','春日聚会','garden','Spring Gathering'],
  ['ISTP','冰蓝机械','mineral','Ice-Blue Machine'],['ISFP','海边画室','water','Seaside Atelier'],['ESTP','熔岩冲浪','ember','Lava Surf'],['ESFP','闪耀舞池','cosmic','Glitter Dancefloor'],
 ].map(([id,n,m,en],i)=>make(id,`${id} · ${n}`,en,m,'一种属于你的配色联想，也可以自由改写。',i%2?[palettes[m][0],palettes[m][1],['#ffc8d9','#d7f2d2','#fff1b7'][i%3]]:undefined))},
 {id:'zodiac',name:'十二星座',short:'星座',en:'Zodiac',tab:'Zodiac',items:[
  ['白羊','ember'],['金牛','garden'],['双子','cosmic'],['巨蟹','water'],['狮子','mineral'],['处女','garden'],['天秤','mineral'],['天蝎','cosmic'],['射手','ember'],['摩羯','sand'],['水瓶','water'],['双鱼','water']
 ].map(([n,m],i)=>make('zodiac-'+i,n+'座',['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][i],m,'把星座的联想变成自己的色彩；自由调色，不设性格限制。'))},
 {id:'planets',name:'行星漫游',short:'行星',en:'Planets',tab:'Planets',items:[
  ['水星','mineral',['#b9bcc6','#6e7286','#f3e7da']],['金星','sand',['#e9c68a','#b08253','#fff5d2']],
  ['地球','water',['#72ced6','#286aa2','#c4eec9']],['火星','ember',['#ce8d76','#954c48','#f1cc96']],
  ['木星','sand',['#dbbaa2','#9e6e65','#f5d5b1']],['土星','cosmic',['#ccb88c','#7b657f','#ffedb8']],
  ['天王星','cosmic',['#a6e0e3','#5b9eae','#f0fbef']],['海王星','cosmic',['#6b94e5','#283b8e','#b5e4ff']]
 ].map(([n,m,c],i)=>make('planet-'+i,n,['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'][i],m,'灵感来自行星的色彩与轨道，做一卷自己的微型宇宙。',c))},
 {id:'flowers',name:'花间来信',short:'花卉',en:'Botanical',tab:'Florals',items:[
  ['雏菊',['#afd69c','#477c58','#ffdf8f']],['樱花',['#edc8db','#af7296','#fff0d6']],
  ['玫瑰',['#d8a8bb','#984c6d','#f9ddd5']],['薰衣草',['#bdb1de','#776295','#e9dcfa']],
  ['绣球',['#b4cce5','#6d82af','#ebd4f4']],['向日葵',['#e7cf87','#aa8441','#fff2a9']],
  ['山茶',['#c7d5bd','#5f806d','#f7dcd8']],['铃兰',['#c6dec8','#6a9a84','#f1f4db']]
 ].map(([n,c],i)=>make('flower-'+i,n,['Daisy','Cherry Blossom','Rose','Lavender','Hydrangea','Sunflower','Camellia','Lily of the Valley'][i],'garden','从花的颜色出发，调出属于自己的春天。',c))},
 {id:'blank',name:'空白创作',short:'空白',en:'Your Own',tab:'Blank',items:[make('blank','留白，给想象','Blank Roll','blank','画一笔，贴一朵花，或者带上你自己的图案。',['#e9ded2','#b5a0af','#ffdfb2'])]},
];
export const allThemes=collections.flatMap(c=>c.items);

// Each preset opens in a contemporary look with a bold palette; the original
// watercolour palette stays available as the "classic" look. IDs never change.
export const pops=[['#2b50ff','#0a1a8c','#ff9bd6'],['#ff9ec7','#161616','#ffffff'],['#ffb347','#f0451a','#e9c9ff'],['#1f6b3a','#0b2a17','#f4ffb8'],['#f3f0e8','#e0312b','#2b50ff'],['#e8ff4f','#2b50ff','#ff4fa3'],['#c9b8ff','#3a1f8c','#fff06a'],['#a8e0ff','#0a3d8c','#ff6a3d'],['#161616','#ff4fa3','#e8ff4f'],['#ffd9e8','#d1123f','#ffffff']];
const looks=['dreamy','stitch','symbol'];
allThemes.forEach((t,i)=>{t.classicColors=t.colors;if(t.id==='blank'){t.look='classic';return;}t.look=looks[i%3];t.colors=pops[(i*7)%pops.length];});

// Indices into the original 6×6 motif atlas; -1 means animated koi.
export function motifFor(id){
 if(id==='blank')return [];
 if(id.startsWith('flower-'))return [Number(id.split('-')[1])];
 if(id.startsWith('planet-'))return [12+Number(id.split('-')[1])];
 if(id.startsWith('zodiac-'))return [24+Number(id.split('-')[1])];
 const motifs={stream:[-1],water:[-1],garden:[0,1,7],coast:[9],forest:[8,7],glacier:[21,10],desert:[22],volcano:[11],night:[20,19],metal:[23,10],wood:[8,6],fire:[11,23],earth:[22,10],INTJ:[20,19],INTP:[10,18],ENTJ:[23,17],ENTP:[11,10],INFJ:[20,6],INFP:[8,1],ENFJ:[0,5],ENFP:[18,19,20],ISTJ:[22,10],ISFJ:[7,0],ESTJ:[23,10],ESFJ:[1,4],ISTP:[10,12],ISFP:[9,4],ESTP:[11,9],ESFP:[17,23,19]};
 return motifs[id]||[0];
}
