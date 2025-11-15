'use client'

import { useEffect, useState } from 'react'

import { usePrint } from '~/hooks/usePrint'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Textarea } from '~/components/ui/textarea'

interface Submission {
  id: number
  participantNumber: number
  realParticipantNo: number | null
  isInitialGift: boolean
  giftType: string
  message: string
  name: string
  lineId: string | null
  instagram: string | null
  assignedGridId: number
  status: string
  createdAt: string
  completedAt: string | null
  grid: {
    gridNumber: number
  }
}

interface Pagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface Grid {
  id: number
  gridNumber: number
}

export default function AdminLogPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [grids, setGrids] = useState<Grid[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0
  })
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 編輯狀態
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null)
  const [editFormData, setEditFormData] = useState({
    giftType: '',
    message: '',
    name: '',
    lineId: '',
    instagram: '',
    gridNumber: '' // 改為 gridNumber（1-30）
  })

  // 刪除狀態
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // 列印功能
  const { print, PrintTemplate } = usePrint()
  const [isPrinting, setIsPrinting] = useState(false)

  // 載入 Grids 資料（id 和 gridNumber 對應）
  const fetchGrids = async () => {
    try {
      const res = await fetch('/api/grids')
      const data = await res.json()
      if (data.success) {
        setGrids(data.grids)
      }
    } catch (error: any) {
      console.error('載入 Grids 失敗:', error)
    }
  }

  // 載入資料
  const fetchSubmissions = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        search,
        sortBy: 'id',  // 改用 id 排序（自增，最新的在最上面）
        sortOrder: 'desc'
      })

      const res = await fetch(`/api/admin/submissions?${params}`)
      const data = await res.json()

      if (data.success) {
        setSubmissions(data.data)
        setPagination(data.pagination)
      } else {
        alert('載入失敗：' + data.error)
      }
    } catch (error: any) {
      alert('載入失敗：' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 初始載入
  useEffect(() => {
    fetchGrids()
  }, [])

  useEffect(() => {
    fetchSubmissions()
  }, [pagination.page, search])

  // 搜尋處理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 開啟編輯 Dialog
  const handleOpenEdit = (submission: Submission) => {
    setEditingSubmission(submission)
    setEditFormData({
      giftType: submission.giftType,
      message: submission.message,
      name: submission.name,
      lineId: submission.lineId || '',
      instagram: submission.instagram || '',
      gridNumber: submission.grid.gridNumber.toString() // 使用 gridNumber
    })
  }

  // 關閉編輯 Dialog
  const handleCloseEdit = () => {
    setEditingSubmission(null)
    setEditFormData({
      giftType: '',
      message: '',
      name: '',
      lineId: '',
      instagram: '',
      gridNumber: ''
    })
  }

  // 提交編輯
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSubmission) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/submissions/${editingSubmission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftType: editFormData.giftType,
          message: editFormData.message,
          name: editFormData.name,
          lineId: editFormData.lineId || null,
          instagram: editFormData.instagram || null,
          // assignedGridId 不再傳送，禁止修改格子編號
        })
      })

      const data = await res.json()

      if (data.success) {
        alert('更新成功！')
        handleCloseEdit()
        fetchSubmissions()
      } else {
        alert('更新失敗：' + data.error)
      }
    } catch (error: any) {
      alert('更新失敗：' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 補列印
  const handleReprint = async (submission: Submission) => {
    if (isPrinting) return

    setIsPrinting(true)
    try {
      // 查詢 previousSubmission
      const res = await fetch(`/api/admin/submissions/${submission.id}/previous`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '查詢上一個參加者失敗')
      }

      // 若為初始禮物，提示使用者
      if (data.isInitialGift) {
        const confirm = window.confirm('此為初始禮物，沒有上一個參加者資料。\n是否仍要列印（上半部會顯示空白）？')
        if (!confirm) {
          setIsPrinting(false)
          return
        }
      }

      // 若查無 previousSubmission（已被刪除）
      if (!data.isInitialGift && !data.previousSubmission) {
        alert('上一個參加者資料已被刪除，無法列印')
        setIsPrinting(false)
        return
      }

      // 構建列印資料
      const printData = {
        previousSubmission: data.previousSubmission,
        currentParticipant: {
          participantNumber: submission.realParticipantNo || submission.participantNumber, // 優先使用真實編號
          gridNumber: submission.grid.gridNumber,
          giftType: submission.giftType,
        },
      }

      // 列印
      const printResult = await print(printData)

      if (printResult === true) {
        alert('列印成功！')
      }
    } catch (error: any) {
      alert('補列印失敗：' + error.message)
    } finally {
      setIsPrinting(false)
    }
  }

  // 確認刪除
  const handleConfirmDelete = async () => {
    if (!deletingId) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/submissions/${deletingId}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        alert('刪除成功！')
        setDeletingId(null)
        fetchSubmissions()
      } else {
        alert('刪除失敗：' + data.error)
      }
    } catch (error: any) {
      alert('刪除失敗：' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 格式化時間
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 禮物類型顯示
  const giftTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      A: 'bg-red',
      B: 'bg-blue-600',
      C: 'bg-green-600'
    }
    return (
      <Badge className={`${colors[type] || 'bg-gray-500'} text-white`}>
        {type}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-10" style={{ maxWidth: '1200px' }}>
      <h1 className="mb-8 text-3xl font-bold">Admin Log - 提交記錄管理</h1>

      {/* 搜尋欄 */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <Input
            type="text"
            placeholder="搜尋姓名或編號（真實編號 / 全局編號）..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-md"
        />
        <Button type="submit">搜尋</Button>
        {search && (
          <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch('')
                setSearchInput('')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
          >
              清除
          </Button>
        )}
      </form>

      {/* 統計資訊 */}
      <div className="mb-4 text-sm text-gray-600">
          共 {pagination.total} 筆記錄
        {search && ` (搜尋：${search})`}
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto rounded-lg border">
        <Table className="bg-white">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">編號</TableHead>
              <TableHead className="w-[60px]">格子</TableHead>
              <TableHead className="w-[60px]">類型</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>LINE</TableHead>
              <TableHead>IG</TableHead>
              <TableHead className="max-w-[200px]">留言</TableHead>
              <TableHead>完成時間</TableHead>
              <TableHead className="w-[150px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                    載入中...
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                    無記錄
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {submission.realParticipantNo ? `#${submission.realParticipantNo}` : '初始'}
                      </span>
                      <span className="text-xs text-gray-500">
                        全局:{submission.participantNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {submission.grid.gridNumber}
                  </TableCell>
                  <TableCell>{giftTypeBadge(submission.giftType)}</TableCell>
                  <TableCell>{submission.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {submission.lineId || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {submission.instagram || '-'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={submission.message}>
                    {submission.message || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(submission.completedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReprint(submission)}
                          disabled={isPrinting}
                      >
                          {isPrinting ? '列印中...' : '補列印'}
                      </Button>
                      <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(submission)}
                      >
                          編輯
                      </Button>
                      <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingId(submission.id)}
                      >
                          刪除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分頁 */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
              第 {pagination.page} / {pagination.totalPages} 頁
          </div>
          <div className="flex gap-2">
            <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
                上一頁
            </Button>
            <Button
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
                下一頁
            </Button>
          </div>
        </div>
      )}

      {/* 編輯 Dialog */}
      <Dialog open={!!editingSubmission} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
                編輯記錄 #{editingSubmission?.realParticipantNo || editingSubmission?.id}
            </DialogTitle>
            <DialogDescription>
                修改後將自動重建相關格子的狀態
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEdit}>
            <div className="grid gap-4 py-4">
              {/* 禮物類型 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">
                    禮物類型 <span className="text-red-500">*</span>
                </label>
                <Select
                    value={editFormData.giftType}
                    onValueChange={(value) =>
                      setEditFormData(prev => ({ ...prev, giftType: value }))
                    }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - 派對</SelectItem>
                    <SelectItem value="B">B - 暖心</SelectItem>
                    <SelectItem value="C">C - 隨性</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 姓名 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">
                    姓名 <span className="text-red-500">*</span>
                </label>
                <Input
                    className="col-span-3"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    required
                />
              </div>

              {/* LINE ID */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">LINE ID</label>
                <Input
                    className="col-span-3"
                    value={editFormData.lineId}
                    onChange={(e) =>
                      setEditFormData(prev => ({ ...prev, lineId: e.target.value }))
                    }
                />
              </div>

              {/* Instagram */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Instagram</label>
                <Input
                    className="col-span-3"
                    value={editFormData.instagram}
                    onChange={(e) =>
                      setEditFormData(prev => ({ ...prev, instagram: e.target.value }))
                    }
                />
              </div>

              {/* 留言 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">留言</label>
                <div className="col-span-3">
                  <Textarea
                      value={editFormData.message}
                      onChange={(e) =>
                        setEditFormData(prev => ({ ...prev, message: e.target.value.slice(0, 20) }))
                      }
                      maxLength={20}
                  />
                  <div className="mt-1 text-right text-xs text-gray-500">
                    {editFormData.message.length} / 20 字
                  </div>
                </div>
              </div>

              {/* 格子編號（唯讀） */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">
                    格子
                </label>
                <div className="col-span-3 text-sm font-medium text-gray-700">
                  {editFormData.gridNumber}
                  <span className="ml-2 text-xs text-gray-500">（不可修改）</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseEdit}>
                  取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '儲存中...' : '儲存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除確認 Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除？</AlertDialogTitle>
            <AlertDialogDescription>
                刪除後將自動重建相關格子的狀態。此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isLoading}>
              {isLoading ? '刪除中...' : '刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 列印模板（隱藏） */}
      {PrintTemplate}
    </div>
  )
}
