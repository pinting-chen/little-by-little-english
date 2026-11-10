// Original teaching selection aligned to CEFR communication goals, not an official list.
const a1Units = [
 ['打招呼與自我介紹','hello:你好|goodbye:再見|please:請|thanks:謝謝|sorry:對不起|yes:是的|no:不是|name:名字|I:我|you:你|we:我們|they:他們|be:是；在|meet:見面|from:來自|live:居住|speak:說（語言）|English:英文|friend:朋友|student:學生'],
 ['家人與身邊物品','family:家人|mother:母親|father:父親|sister:姊妹|brother:兄弟|home:家|house:房子|room:房間|door:門|window:窗戶|table:桌子|chair:椅子|bed:床|bag:袋子；包包|book:書|phone:電話|key:鑰匙|have:有|this:這個|that:那個'],
 ['時間與生活作息','day:一天；白天|week:星期|weekend:週末|morning:早晨|afternoon:下午|night:夜晚|today:今天|tomorrow:明天|now:現在|time:時間|early:早的|late:晚的；遲到的|get:取得|go:去|come:來|sleep:睡覺|work:工作|study:學習|read:閱讀|watch:觀看'],
 ['飲食與簡單需求','food:食物|water:水|tea:茶|coffee:咖啡|milk:牛奶|bread:麵包|rice:米飯|egg:蛋|apple:蘋果|chicken:雞肉|breakfast:早餐|lunch:午餐|dinner:晚餐|eat:吃|drink:喝|want:想要|need:需要|like:喜歡|some:一些|more:更多'],
 ['地點與問路','where:在哪裡|here:這裡|there:那裡|left:左邊|right:右邊|near:附近|street:街道|school:學校|shop:商店|park:公園|station:車站|bus:公車|train:火車|car:汽車|walk:走路|stop:停下；站牌|open:開著的；打開|close:關上|help:幫忙|find:找到'],
 ['購物與基本描述','buy:買|pay:付款|money:錢|price:價格|how:如何|much:多（不可數）|many:多（可數）|one:一|two:二|three:三|big:大的|small:小的|new:新的|old:舊的；年老的|good:好的|bad:不好的|hot:熱的|cold:冷的|happy:開心的|tired:累的']
].map(([title,words])=>[title,words.split('|').map(word=>word.split(':'))]);
const coreWords = a1Units.flatMap(([,words])=>words);
const a2Units = [
 ['生活作息','日常','用頻率與時間說明一項習慣。',[
  ['usually','副詞','通常','usually get up','I usually get up at seven.','我通常七點起床。'],
  ['prepare','動詞','準備','prepare breakfast','I prepare breakfast before work.','我上班前會準備早餐。'],
  ['routine','名詞','例行作息','daily routine','Walking is part of my daily routine.','散步是我每天作息的一部分。'],
  ['exercise','名詞','運動','get some exercise','I walk to work to get some exercise.','我走路上班，好做點運動。']]],
 ['餐廳點餐','日常','能點一份餐並確認是否包含飲料。',[
  ['order','動詞','點餐','order a meal','I’d like to order a meal.','我想點一份餐。'],
  ['menu','名詞','菜單','look at the menu','Can I look at the menu?','我可以看一下菜單嗎？'],
  ['include','動詞','包含','include a drink','Does the meal include a drink?','這份餐有附飲料嗎？'],
  ['bill','名詞','帳單','ask for the bill','Could we have the bill, please?','可以請你給我們帳單嗎？']]],
 ['交通與旅行','旅遊','能確認班次、轉車及車程。',[
  ['leave','動詞','出發','leave at nine','The train leaves at nine.','火車九點出發。'],
  ['change','動詞','轉乘','change trains','Do we need to change trains?','我們需要轉車嗎？'],
  ['journey','名詞','旅程','a short journey','It’s a short journey by bus.','搭公車是一段很短的路程。'],
  ['direction','名詞','方向','in the right direction','Are we going in the right direction?','我們走的方向對嗎？']]],
 ['購物與尺寸','日常','能比較商品並詢問是否能試穿。',[
  ['size','名詞','尺寸','a smaller size','Do you have a smaller size?','你們有小一號的嗎？'],
  ['try on','片語動詞','試穿','try on a jacket','Can I try on this jacket?','我可以試穿這件外套嗎？'],
  ['comfortable','形容詞','舒適的','feel comfortable','These shoes feel comfortable.','這雙鞋穿起來很舒服。'],
  ['enough','副詞','足夠地','big enough','Is this bag big enough?','這個包夠大嗎？']]],
 ['工作與約時間','工作','能確認是否有空，以及更改見面時間。',[
  ['available','形容詞','有空的','available on Friday','Are you available on Friday?','你星期五有空嗎？'],
  ['appointment','名詞','預約；約定','make an appointment','I’d like to make an appointment.','我想預約。'],
  ['message','名詞','訊息','leave a message','Can I leave a message?','我可以留言嗎？'],
  ['later','副詞','稍後','call back later','I’ll call back later.','我稍後會再打來。']]],
 ['興趣延伸・自由潛水','自由潛水','用簡單句子介紹興趣、裝備和潛伴。',[
  ['freediving','名詞','自由潛水','go freediving','I go freediving on weekends.','我週末會去自由潛水。'],
  ['gear','不可數名詞','裝備','bring your gear','Do you have your gear with you?','你有帶裝備嗎？'],
  ['fins','複數名詞','蛙鞋','a pair of fins','I have a pair of fins.','我有一雙蛙鞋。'],
  ['dive buddy','名詞片語','潛伴','meet my dive buddy','I’m meeting my dive buddy at the beach.','我要在海灘跟潛伴碰面。']]]
];
