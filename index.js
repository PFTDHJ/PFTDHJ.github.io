const { createApp, reactive, toRefs, onMounted, ref, computed } = Vue
const { useQuasar } = Quasar
const app = createApp({
  setup() {
    const columns = [
      { name: 'a', align: 'left', label: '物品', field: 'a', sortable: true },
      { name: 'n', align: 'left', label: '数量', field: 'n', sortable: true }
    ]

    const $q = useQuasar()
    let tab = ref('input')
    let text = ref('')
    let splitChars = ref(',，。、- ')

    let rows = computed(() => {
      if (!text.value) {
        return []
      }
      const _array = text.value.split('各')
      let target = text.value.split('各')[0]
      let number = 0
      if (_array[1]) {
        number = +_array[1].replace(/[^0-9]/ig, "")
      }
      const regExp = new RegExp(splitChars.value.split('').join('|'), 'gm')
      let itemArray = target.replace(regExp, '$').split('$')
      let items = itemArray.map(t => {
        return {
          a: t,
          n: number
        }
      })

      return items
    })

    let sums = ref({})
    let sumsText = ref({})

    const calcTotal = () => {
      const _itemsLocal = localStorage.getItem('items')
      if (!_itemsLocal) {
        return
      }
      const items = JSON.parse(_itemsLocal)
      const total = {}
      items.forEach(item => {
        const keys = Object.keys(item)
        keys.forEach(key => {
          if (key !== 'w' && key !== 't') {
            if (total[key]) {
              total[key] = total[key] + item[key]
            } else {
              total[key] = item[key]
            }
          }
        })
      })
      sums.value = Object.keys(total).map(t => {
        return {
          a: t,
          n: total[t]
        }
      })

      sumsText.value = Object.keys(total).map(t => t+total[t]).join(' ')
    }

    const submit = () => {
      if (!text.value) {
        return
      }
      try {
        const _itemsLocal = localStorage.getItem('items')
        let _items = []
        if (_itemsLocal) {
          _items = JSON.parse(_itemsLocal)
        }

        const data = {}
        rows.value.forEach(t => {
          data[t['a']] = t['n']
        })

        const dataString = JSON.stringify([
          ..._items,
          {
            ...data,
            w: text.value,
            t: +new Date()
          }
        ])

        localStorage.setItem('items', dataString)

        $q.notify({
          color: 'primary',
          message: '保存成功'
        })
        calcTotal()
        setTimeout(() => {
          text.value = ''
        }, 200)
      } catch (e) {
        $q.notify({
          message: '出错了'
        })
      }
    }

    let loading =ref(false)
    const onExport = () => {
      loading.value = true
      const itemsLocal = localStorage.getItem('items')
      if (!itemsLocal) {
        $q.notify({
          message: '无数据'
        })
        loading.value = false
        return
      }
      const workbook = XLSX.utils.book_new();

      const data1 = sums.value.map((t) => {
        return {
          物品: t.a,
          数量: t.n
        }
      })
      const worksheet1 = XLSX.utils.json_to_sheet(data1);
      XLSX.utils.book_append_sheet(workbook, worksheet1, '统计表');

      let items = JSON.parse(itemsLocal)
      const data2 = items.map((t) => {
        return {
          时间: new Date(t.t).toLocaleString(),
          原始文本: t.w,
          ...t
        }
      })

      data2.forEach(t => {
        delete t.t
        delete t.w
      })

      const worksheet2 = XLSX.utils.json_to_sheet(data2);
      XLSX.utils.book_append_sheet(workbook, worksheet2, '原始记录表');

      XLSX.writeFile(workbook, 'data.xlsx');
      setTimeout(() => {
        loading.value = false
      }, 800)
    }

    const clear = () => {
      localStorage.clear()
      sums.value = []
    }

    onMounted(() => {
      calcTotal()
    })

    return {
      onchange,
      submit,
      onExport,
      clear,
      rows,
      sums,
      sumsText,
      splitChars,
      tab,
      text,
      loading,
      columns
    }
  }
})
app.use(Quasar)
Quasar.lang.set(Quasar.lang.zhCN)
app.mount('#q-app')
