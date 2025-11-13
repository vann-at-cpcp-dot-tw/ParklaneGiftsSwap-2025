'use client'

import { useState } from 'react'

import { ScopeStoreProvider } from './scope-store'
import Guard from '../(game-steps)/Guard'

export default function Home() {
  const [currentStep, setCurrentStep] = useState('guard')

  return (
    <ScopeStoreProvider state={{ data: { hello: 'world' } }}>
      { currentStep === 'guard' && <Guard onValidated={() => setCurrentStep('next')} /> }
    </ScopeStoreProvider>
  )
}
