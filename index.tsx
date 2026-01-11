
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  RefreshCcw, Trophy, Star, Heart,
  Gauge, Train, Sparkles
} from 'lucide-react';

// --- 常量与类型 ---
const GRID_SIZE = 15;
const INITIAL_SNAKE = [{ x: 7, y: 7 }, { x: 7, y: 8 }, { x: 7, y: 9 }];
const INITIAL_DIRECTION = 'UP';

const SPEED_MAP: Record<number, number> = {
  1: 400,
  2: 300,
  3: 200,
  4: 140,
  5: 80
};

// 内置 15 种丰富的美食池
const FOOD_POOL = [
  "🍎", "🫐", "🍇", "🍕", "🍔", 
  "🍦", "🍭", "🍍", "🍉", "🍓", 
  "🍒", "🍩", "🍫", "🍌", "🥝"
];

type Point = { x: number, y: number, emoji?: string };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameMode = 'snake' | 'train';

interface GameTheme {
  name: string;
  backgroundColor: string;
  snakeColor: string;
  headEmoji: string;
  locomotiveEmoji: string;
  wagonEmoji: string;
  message: string;
}

// 预设的主题库
const PRESET_THEMES: GameTheme[] = [
  {
    name: "青青草原",
    backgroundColor: "#e8f5e9",
    snakeColor: "#4caf50",
    headEmoji: "👀",
    locomotiveEmoji: "🚂",
    wagonEmoji: "🚃",
    message: "在草地上快乐地玩耍吧！"
  },
  {
    name: "深海世界",
    backgroundColor: "#e1f5fe",
    snakeColor: "#0288d1",
    headEmoji: "🐙",
    locomotiveEmoji: "🚢",
    wagonEmoji: "⚓",
    message: "小鱼儿真好吃呀！"
  },
  {
    name: "甜点王国",
    backgroundColor: "#fce4ec",
    snakeColor: "#ec407a",
    headEmoji: "😋",
    locomotiveEmoji: "🍰",
    wagonEmoji: "🧁",
    message: "全是甜甜的味道～"
  },
  {
    name: "星际探索",
    backgroundColor: "#1a237e",
    snakeColor: "#7986cb",
    headEmoji: "👩‍🚀",
    locomotiveEmoji: "🚀",
    wagonEmoji: "🛸",
    message: "向着星星出发！"
  }
];

// --- App 组件 ---
const App = () => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5, emoji: "🍎" });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0); 
  const [gameMode, setGameMode] = useState<GameMode>('snake');
  const [showPop, setShowPop] = useState(false);
  const [speedLevel, setSpeedLevel] = useState(3);

  const gameLoopRef = useRef<number | null>(null);
  const lastMoveRef = useRef<Direction>(INITIAL_DIRECTION);
  const currentTheme = PRESET_THEMES[themeIndex];

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFoodPos: { x: number, y: number };
    while (true) {
      newFoodPos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(segment => segment.x === newFoodPos.x && segment.y === newFoodPos.y)) {
        break;
      }
    }
    const randomEmoji = FOOD_POOL[Math.floor(Math.random() * FOOD_POOL.length)];
    return { ...newFoodPos, emoji: randomEmoji };
  }, []);

  const resetGame = () => {
    const newSnake = [...INITIAL_SNAKE];
    setThemeIndex(Math.floor(Math.random() * PRESET_THEMES.length));
    setSnake(newSnake);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(newSnake));
    setScore(0);
    setIsGameOver(false);
    lastMoveRef.current = INITIAL_DIRECTION;
  };

  const toggleMode = () => {
    setGameMode(prev => prev === 'snake' ? 'train' : 'snake');
  };

  const moveSnake = useCallback(() => {
    if (isGameOver) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setIsGameOver(true);
        return prevSnake;
      }

      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
        setShowPop(true);
        setTimeout(() => setShowPop(false), 300);
      } else {
        newSnake.pop();
      }

      lastMoveRef.current = direction;
      return newSnake;
    });
  }, [direction, food, isGameOver, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (lastMoveRef.current !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (lastMoveRef.current !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (lastMoveRef.current !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (lastMoveRef.current !== 'LEFT') setDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isGameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = window.setInterval(moveSnake, SPEED_MAP[speedLevel]);
    } else {
      if (score > highScore) setHighScore(score);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, isGameOver, score, highScore, speedLevel]);

  return (
    <div className="min-h-screen bg-pink-50 font-sans p-4 flex flex-col items-center select-none overflow-y-auto" style={{ backgroundColor: currentTheme.backgroundColor + '22' }}>
      
      {/* 头部标题和分数 */}
      <div className="w-full max-w-md flex flex-col items-center mb-4">
        <h1 className="text-4xl font-black text-pink-600 drop-shadow-sm flex items-center gap-2 mb-2">
          {gameMode === 'snake' ? '欢乐贪吃蛇' : '开心火车'} <Heart className="fill-pink-500 text-pink-500" />
        </h1>
        
        <div className="flex gap-4 w-full justify-center">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md border-b-4 border-gray-200 flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            <span className="font-bold text-xl text-gray-700">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md border-b-4 border-gray-200 flex items-center gap-2">
            <Star className="text-blue-400" />
            <span className="font-bold text-xl text-gray-500">{highScore}</span>
          </div>
        </div>
      </div>

      {/* 模式切换与场景提示 */}
      <div className="flex gap-2 mb-2">
        <button 
          onClick={toggleMode}
          className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full text-xs font-black text-purple-500 shadow-sm border border-purple-100 hover:bg-purple-50 transition-colors"
        >
          {gameMode === 'snake' ? <Train size={14} /> : <Sparkles size={14} />}
          切换为{gameMode === 'snake' ? '火车' : '贪吃蛇'}形态
        </button>
        <div className="px-4 py-1.5 bg-white/50 rounded-full text-xs font-bold text-gray-500 border border-white">
          场景：{currentTheme.name}
        </div>
      </div>

      {/* 游戏面板 */}
      <div className="relative mb-4">
        <div 
          className="grid gap-0 rounded-3xl overflow-hidden shadow-2xl border-8 border-white"
          style={{ 
            backgroundColor: currentTheme.backgroundColor,
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: '85vw',
            maxWidth: '380px',
            aspectRatio: '1/1'
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isFood = food.x === x && food.y === y;
            const snakeIndex = snake.findIndex(s => s.x === x && s.y === y);
            const isHead = snakeIndex === 0;

            return (
              <div key={i} className="relative flex items-center justify-center">
                {isFood && (
                  <span className="text-2xl animate-bounce transform transition-transform duration-300 scale-125">
                    {food.emoji}
                  </span>
                )}
                {snakeIndex !== -1 && (
                  <div 
                    className={`w-full h-full flex items-center justify-center transition-all duration-200 ${isHead ? 'z-10' : 'scale-90'}`}
                    style={gameMode === 'snake' ? { backgroundColor: currentTheme.snakeColor, borderRadius: isHead ? '8px' : '9999px' } : {}}
                  >
                    {isHead ? (
                       <span className={`text-2xl ${gameMode === 'train' ? 'drop-shadow-sm' : ''}`}>
                         {gameMode === 'snake' ? currentTheme.headEmoji : currentTheme.locomotiveEmoji}
                       </span>
                    ) : (
                      gameMode === 'train' ? (
                        <div className="w-4/5 h-4/5 rounded-md flex items-center justify-center opacity-90 shadow-sm" style={{ backgroundColor: currentTheme.snakeColor }}>
                           <span className="text-[10px] grayscale opacity-50">{currentTheme.wagonEmoji}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showPop && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping text-4xl pointer-events-none z-20 font-black text-orange-500">
            {gameMode === 'snake' ? '好香呀! 😋' : '装货成功! 📦'}
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl animate-in fade-in zoom-in duration-300 z-30">
            <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center border-4 border-pink-200">
              <span className="text-6xl mb-4">{gameMode === 'snake' ? '😵' : '🚉'}</span>
              <h2 className="text-3xl font-black text-pink-600 mb-2">
                {gameMode === 'snake' ? '哎呀！' : '列车到站！'}
              </h2>
              <p className="text-gray-600 font-medium mb-6 text-center">
                {gameMode === 'snake' ? '小蛇累了，休息一下吧！' : '小火车需要维护，准备发车！'}
              </p>
              <button 
                onClick={resetGame}
                className="bg-green-400 hover:bg-green-500 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-lg transform active:scale-95 transition-all flex items-center gap-2 border-b-4 border-green-600"
              >
                <RefreshCcw /> 换个场景再玩！
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 速度调节器 */}
      <div className="w-full max-w-md bg-white p-4 rounded-3xl shadow-lg border-b-4 border-gray-100 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-500 font-bold text-sm flex items-center gap-2">
            <Gauge className="w-4 h-4 text-orange-400" /> 行动速度: {speedLevel}
          </p>
          <span className="text-xs font-bold text-orange-400">
            {speedLevel === 1 ? '🐢 悠闲' : speedLevel === 5 ? '🚀 冲刺' : '✨ 正常'}
          </span>
        </div>
        <div className="px-2">
          <input 
            type="range" 
            min="1" 
            max="5" 
            step="1" 
            value={speedLevel}
            onChange={(e) => setSpeedLevel(parseInt(e.target.value))}
            className="w-full h-3 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[10px] text-gray-400 font-bold">慢悠悠</span>
            <span className="text-[10px] text-gray-400 font-bold">飞一样</span>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[180px] mb-4">
        <div />
        <ControlButton icon={<ArrowUp />} onClick={() => lastMoveRef.current !== 'DOWN' && setDirection('UP')} color="bg-orange-400" border="border-orange-600" />
        <div />
        <ControlButton icon={<ArrowLeft />} onClick={() => lastMoveRef.current !== 'RIGHT' && setDirection('LEFT')} color="bg-orange-400" border="border-orange-600" />
        <ControlButton icon={<ArrowDown />} onClick={() => lastMoveRef.current !== 'UP' && setDirection('DOWN')} color="bg-orange-400" border="border-orange-600" />
        <ControlButton icon={<ArrowRight />} onClick={() => lastMoveRef.current !== 'LEFT' && setDirection('RIGHT')} color="bg-orange-400" border="border-orange-600" />
      </div>

      <footer className="text-gray-300 text-[10px] font-bold uppercase tracking-widest pb-4 text-center">
        Joyful {gameMode === 'snake' ? 'Snake' : 'Train'} • 场景随机变换 • 快乐成长
      </footer>
    </div>
  );
};

const ControlButton = ({ icon, onClick, color, border }: { icon: React.ReactNode, onClick: () => void, color: string, border: string }) => (
  <button 
    onClick={onClick}
    className={`${color} text-white p-4 rounded-2xl shadow-lg transform active:translate-y-1 transition-all flex items-center justify-center border-b-4 ${border}`}
  >
    {icon}
  </button>
);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
