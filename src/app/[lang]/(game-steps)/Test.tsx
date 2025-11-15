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
  answers: Array<'A' | 'B' | 'C'>
}

const questions = [
  {
    q: '如果你是聖誕老公公的 AI 助手， 你會怎麼派送禮物？',
    a: [
      { type: 'A', text: '開直播無人機空投＋煙火秀 全球同步倒數' },
      { type: 'B', text: '偷偷塞進對方枕頭底下，附一封只有你看得到的信' },
      { type: 'C', text: '用衛星定位隨機投放，找到算你運氣好' },
    ]
  },
  {
    q: '你的 MBTI 在聖誕派對上最像：',
    a: [
      { type: 'A', text: '剛進門就變 DJ，整場都在控台' },
      { type: 'B', text: '幫大家掛襪子、寫祝福卡，氣氛製造機' },
      { type: 'C', text: '看到聖誕帽就戴，衣服配不配都無所謂' },
    ]
  },
  {
    q: '萬一聖誕夜全世界只剩 3 小時電，你會？',
    a: [
      { type: 'A', text: '開末日 BBQ 派對，冰箱清空就是今晚菜單' },
      { type: 'B', text: '點滿蠟燭圍爐，講故事講到最後一秒' },
      { type: 'C', text: '先睡再說，醒來發現根本是自己沒繳電費' },
    ]
  },
  {
    q: '你挑聖誕交換禮物時最在意：',
    a: [
      { type: 'A', text: '包裝要能閃瞎攝影師，直接上熱門 Reels' },
      { type: 'B', text: '對方打開會紅眼眶，當場抱住你說你最懂我' },
      { type: 'C', text: '剛好路過跳蚤市場看到，覺得這怪怪的好可愛' },
    ]
  },
  {
    q: '到了交換禮物環節，你最想玩的遊戲是？',
    a: [
      { type: 'A', text: '俄羅斯禮物盒：轉到爆炸就是你的' },
      { type: 'B', text: '心跳拆包裝：每拆一層要說一句暖心話 ' },
      { type: 'C', text: '隨機抽卡：抽到自由就能把禮物亂丟' },
    ]
  },
  {
    q: '如果你的禮物會說話，它會對你說什麼？',
    a: [
      { type: 'A', text: '「快拆我！裡面有 50 個派對喇叭！」' },
      { type: 'B', text: '「我其實只是想陪你看一場雪。」' },
      { type: 'C', text: '「雖然我過期了，但還能拿去換熱紅酒。」' },
    ]
  },
]

export default function Test(props:IProps){

  const { id, className } = props ?? {}
  const {gameState, setGameState} = useScopeStore()
  const [questionState, setQuestionState] = useReducer((state:IState, updateState:{})=>({...state, ...updateState}), {
    currentIndex: 0,
    answers: [],
  })

  const currentQuestion = useMemo(()=>{
    return questions[questionState.currentIndex]
  }, [questionState.currentIndex])

  function handleChoice(type: 'A' | 'B' | 'C') {
    const newAnswers = [...questionState.answers, type]
    setQuestionState({
      answers: newAnswers
    })

    setTimeout(()=>{
      setQuestionState({
        currentIndex: questionState.currentIndex + 1
      })
    }, 300)

    // 最後一題選完
    if(questionState.currentIndex+1 >= questions.length) {

      const counts = { A: 0, B: 0, C: 0 }
      const basedAnswer = newAnswers[5] // 並列時，以第六題為準

      newAnswers.forEach(answer => {
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
                className="mb-8 min-h-[144px] w-full rounded-lg bg-[#DCDD9B] p-6 text-center text-[32px] font-bold text-[#3E1914] transition-colors last:mb-0 active:bg-[#3E1914] active:text-[#DCDD9B]"
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
    </div>
  </div>
}
