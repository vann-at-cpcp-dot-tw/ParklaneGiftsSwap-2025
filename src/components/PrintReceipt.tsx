import { forwardRef } from 'react'

import { PRINT_INFO } from '~/constants/print'
import type { PrintData } from '~/hooks/usePrint'
import { padLeft } from '~/lib/utils'

interface PrintReceiptProps {
  data: PrintData | null
}

/**
 * 列印模板組件
 */
const PrintReceipt = forwardRef<HTMLDivElement, PrintReceiptProps>(
  ({ data }, ref) => {
    if (!data) return null

    const { previousSubmission, currentParticipant } = data

    return (
      <div
        ref={ref}
        style={{
          position: 'fixed',
          left: '-9999px',
          width: '1152px',
          backgroundColor: '#ffffff',
          color: '#000000',
        }}
      >
        <div className="mb-[60px] pt-10">
          <img className="w-full" src="/img/print_title.jpg" alt="" />
        </div>

        <div className="my-[100px] px-[40px] text-[50px] leading-[2]">
          {previousSubmission
            ? PRINT_INFO.description[previousSubmission.giftType as 'A' | 'B' | 'C']
            : ''}
        </div>

        <div className="mb-[100px]">
          <img className="w-full" src="/img/print_line_1.jpg" alt="" />
        </div>

        <div className="mb-[80px]">
          <div className="-mb-5 text-center text-[60px]">
            {currentParticipant.participantNumber ? (
              <div>
                你好，#{padLeft(String(currentParticipant.participantNumber), 5)} 參賽者
              </div>
            ) : (
              ''
            )}
            <div>
              我的頻道是「
              {previousSubmission
                ? PRINT_INFO.giftType[previousSubmission.giftType as 'A' | 'B' | 'C']
                : ''}
              」
            </div>
            <div>我們共同的神秘密碼是</div>
          </div>
          <div
            className="flex items-end justify-center text-center"
            style={{ fontWeight: 900, lineHeight: 1 }}
          >
            <span className="text-[100px]">no.</span>
            <span className="text-[240px]">{currentParticipant.gridNumber}</span>
          </div>
        </div>

        <div className="-mb-10 pt-[80px]">
          <img className="w-full" src="/img/print_line_2.jpg" alt="" />
        </div>

        <div className="pb-[100px]">
          <div
            className="flex flex-nowrap items-start justify-center"
            style={{
              paddingTop: '120px',
              marginBottom: '-250px',
              marginLeft: '110px',
            }}
          >
            <img src="/img/print_deco_1.jpg" alt="" style={{ width: '160px' }} />
            <div className="px-12 text-[60px]" style={{ marginTop: '60px' }}>
              想對你說：
            </div>
            <img
              className="relative"
              src="/img/print_deco_2.jpg"
              alt=""
              style={{ width: '190px', marginTop: '200px', right: '-60px' }}
            />
          </div>
          <div
            className="mx-auto text-center"
            style={{
              fontSize: '300px',
              lineHeight: 1,
              fontWeight: 900,
            }}
          >
            {previousSubmission
              ? (previousSubmission.message || '').split('').map((node, index) => (
                <div key={index}>{node === ' ' ? '\u00A0' : node}</div>
              ))
              : ''}
          </div>
        </div>

        <div className="mb-[100px] pt-[120px]">
          <img className="w-full" src="/img/print_line_1.jpg" alt="" />
        </div>

        <div className="px-[40px] text-[60px]">
          <div className="mb-[60px] text-[60px]">
            如果你也想繼續派對模式，來找我吧！
          </div>
          <div className="flex flex-nowrap">
            <div className="flex-none font-bold">NAME：</div>
            <div className="flex-grow">{previousSubmission?.name}</div>
          </div>
          <div className="flex flex-nowrap">
            <div className="flex-none font-bold">LINE：</div>
            <div className="flex-grow">{previousSubmission?.lineId}</div>
          </div>
          <div className="flex flex-nowrap">
            <div className="flex-none font-bold">IG：</div>
            <div className="flex-grow">{previousSubmission?.instagram}</div>
          </div>
        </div>

        <div className="px-[40px] pb-[80px] pt-[120px]">
          <img className="w-full" src="/img/print_merry.jpg" alt="" />
        </div>
      </div>
    )
  }
)

PrintReceipt.displayName = 'PrintReceipt'

export default PrintReceipt
