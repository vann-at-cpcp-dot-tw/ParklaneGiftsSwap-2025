"use client"

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import { Suspense, useEffect, useReducer, useMemo } from 'react'

import { twMerge } from 'tailwind-merge'

import { useScopeStore } from '~/app/[lang]/(home)/scope-store'
import LinkWithLang from "~/components/custom/LinkWithLang"
import { isEmpty } from '~/lib/utils'

interface IProps {
  id?: string
  className?: string
}

interface IState {
  currentIndex: number
  answers: { [key: number]: 'A' | 'B' | 'C' }  // 用物件儲存，key 是題號，允許修改
}

const questions = [
  {
    q: '如果你是聖誕老公公的 AI 助手， 你會怎麼派送禮物？',
    a: [
      { type: 'A', text: <div>開直播無人機空投＋煙火秀<br/>全球同步倒數</div> },
      { type: 'B', text: <div>偷偷塞進對方枕頭底下<br/>附一封只有你看得到的信</div> },
      { type: 'C', text: <div>用衛星定位隨機投放<br/>找到算你運氣好</div> },
    ]
  },
  {
    q: '你的 MBTI 在聖誕派對上最像：',
    a: [
      { type: 'A', text: <div>剛進門就變 DJ，整場都在控台</div> },
      { type: 'B', text: <div>幫大家掛襪子、寫祝福卡<br/>氣氛製造機</div> },
      { type: 'C', text: <div>看到聖誕帽就戴<br/>衣服配不配都無所謂</div> },
    ]
  },
  {
    q: '萬一聖誕夜全世界只剩 3 小時電，你會？',
    a: [
      { type: 'A', text: <div>開末日 BBQ 派對<br/>冰箱清空就是今晚菜單</div> },
      { type: 'B', text: <div>點滿蠟燭圍爐<br/>講故事講到最後一秒</div> },
      { type: 'C', text: <div>先睡再說<br/>醒來發現根本是自己沒繳電費</div> },
    ]
  },
  {
    q: '你挑聖誕交換禮物時最在意：',
    a: [
      { type: 'A', text: <div>包裝要能閃瞎攝影師<br/>直接上熱門 Reels</div> },
      { type: 'B', text: <div>對方打開會紅眼眶<br/>當場抱住你說你最懂我</div> },
      { type: 'C', text: <div>剛好路過跳蚤市場看到<br/>覺得這怪怪的好可愛</div> },
    ]
  },
  {
    q: '到了交換禮物環節，你最想玩的遊戲是？',
    a: [
      { type: 'A', text: <div>俄羅斯禮物盒：<br/>轉到爆炸就是你的</div> },
      { type: 'B', text: <div>心跳拆包裝：<br/>每拆一層要說一句暖心話</div> },
      { type: 'C', text: <div>隨機抽卡：<br/>抽到自由就能把禮物亂丟</div> },
    ]
  },
  {
    q: '如果你的禮物會說話，它會對你說什麼？',
    a: [
      { type: 'A', text: <div>快拆我！裡面有 50 個派對喇叭</div> },
      { type: 'B', text: <div>我其實只是想陪你看一場雪</div> },
      { type: 'C', text: <div>雖然我過期了<br/>但還能拿去換熱紅酒</div> },
    ]
  },
]

export default function Test(props:IProps){

  const { id, className } = props ?? {}
  const {gameState, setGameState} = useScopeStore()
  const [questionState, setQuestionState] = useReducer((state:IState, updateState:{})=>({...state, ...updateState}), {
    currentIndex: 0,
    answers: {},  // 空物件
  })

  const currentQuestion = useMemo(()=>{
    return questions[questionState.currentIndex]
  }, [questionState.currentIndex])

  function handleChoice(type: 'A' | 'B' | 'C') {
    // 記錄當前題目的答案（可覆蓋）
    setQuestionState({
      answers: {
        ...questionState.answers,
        [questionState.currentIndex]: type
      }
    })
    // 移除自動跳題邏輯
  }

  function handleNext() {
    if (questionState.currentIndex < questions.length - 1) {
      // 還有下一題
      setQuestionState({ currentIndex: questionState.currentIndex + 1 })
    } else {
      // 最後一題，計算結果
      const answerArray = Object.values(questionState.answers)
      const counts = { A: 0, B: 0, C: 0 }
      const basedAnswer = questionState.answers[5] // 第 6 題（索引 5）

      answerArray.forEach(answer => {
        counts[answer] += 1
      })

      // 找出最高分
      const maxCount = Math.max(counts.A, counts.B, counts.C)
      const winningTypes = Object.keys(counts).filter(
        key => counts[key as 'A' | 'B' | 'C'] === maxCount
      ) as Array<'A' | 'B' | 'C'>

      // 如果有唯一最大值，用它；否則（並列）用 basedAnswer
      setGameState({
        giftType: winningTypes.length === 1 ? winningTypes[0] : basedAnswer,
        currentStep: 'message',
      })
    }
  }

  function handlePrev() {
    if (questionState.currentIndex > 0) {
      setQuestionState({ currentIndex: questionState.currentIndex - 1 })
    }
  }

  return <div className={twMerge('bg-red min-h-full relative flex flex-col justify-center', className)}>
    <img className="pointer-events-none fixed left-0 top-1/2 z-0 w-full -translate-y-1/2" src="/img/question_deco_bg.svg" alt="" />

    <div className="container z-1 relative py-5">
      {
        !isEmpty(currentQuestion) && <div className="mx-auto w-full max-w-[531px]">
          <div className="mb-3"><img className="h-[82px] w-auto" src={`img/q${questionState.currentIndex+1}.svg`} alt="" /></div>
          <div className="mb-10 text-[36px] font-bold text-white">{currentQuestion.q}</div>
          <div className="flex flex-col items-center">
            {
              currentQuestion.a.map((answer, answerIndex)=>(
                <button
                key={answerIndex}
                className={twMerge(
                  "mb-8 min-h-[144px] w-full rounded-lg p-6 text-center text-[32px] font-bold transition-colors last:mb-0",
                  questionState.answers[questionState.currentIndex] === answer.type
                    ? "bg-[#3E1914] text-[#DCDD9B]"  // 已選中
                    : "bg-[#DCDD9B] text-[#3E1914] active:bg-[#3E1914] active:text-[#DCDD9B]"
                )}
                onClick={() => handleChoice(answer.type as 'A' | 'B' | 'C')}
                style={{
                  boxShadow: '8px 8px 4px 0px rgba(0, 0, 0, 0.25)',
                }}>
                  { answer.text }
                </button>
              ))
            }
          </div>
        </div>
      }

      <div className="mt-16 flex justify-center gap-5">
        <button
          disabled={questionState.currentIndex === 0}
          className={twMerge(
            "flex h-[64px] w-[176px] items-center justify-center rounded-full text-[32px] font-bold transition-colors",
            questionState.currentIndex === 0
              ? "cursor-not-allowed bg-gray-400 text-gray-600 opacity-50"
              : "bg-[#DCDD9B] text-[#3E1914] active:bg-[#3E1914] active:text-[#DCDD9B]"
          )}
          onClick={handlePrev}
        >
          上一題
        </button>

        <button
          disabled={questionState.answers[questionState.currentIndex] === undefined}
          className={twMerge(
            "flex h-[64px] w-[176px] items-center justify-center rounded-full text-[32px] font-bold transition-colors",
            questionState.answers[questionState.currentIndex] === undefined
              ? "cursor-not-allowed bg-gray-400 text-gray-600 opacity-50"
              : "bg-[#DCDD9B] text-[#3E1914] active:bg-[#3E1914] active:text-[#DCDD9B]"
          )}
          onClick={handleNext}
        >
          {questionState.currentIndex === questions.length - 1 ? '確認！' : '下一題'}
        </button>
      </div>
    </div>

  </div>
}
