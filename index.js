import axios from 'axios'
import dotenv from 'dotenv'
import { map, pipe, filter, pluck, sum, groupBy, prop, values, sortWith, descend } from 'ramda'

dotenv.config()

const TOKEN = process.env.TOKEN

const instance = axios.create({
    timeout: 1000,
    headers: {
        'Authorization': `Bearer ${TOKEN}`
    }
})


const formatIntToFloat = (value) => parseFloat(`${value.slice(0, value.length - 2).join('')}.${value.slice(value.length - 2, value.length).join('')}`)
const getConcluded = filter(o => o.lastStatus === 'CONCLUDED')

const pipeSum = pipe(
    getConcluded,
    pluck('bag'),
    map(o => o.total.valueWithDiscount),
    sum,
    String,
    Array.from,
    formatIntToFloat,
    (v) => v.toLocaleString('pt-br', { style: 'currency', currency: 'BRL'})
)

const getMerchants = pipe(
    getConcluded,
    pluck('merchant'),
    groupBy(prop('id'))
)

const getMerchantMoreDemanded = pipe(
    getMerchants,
    map(d => ({ merchant: { ...d[0] }, qtd: d.length })),
    values,
    sortWith([
        descend(prop('qtd'))
    ])
)

const get = async () => {
    let orders = []
    for (let i=1;i<20;i++) {
        const response = await instance.get(`https://marketplace.ifood.com.br/v4/customers/me/orders?page=${i}&size=25`)
        if (response.data.length === 0) {
            i = 20
        }    

        orders = [...orders, ...response.data]
    }

    const moreDemandedMerchants = getMerchantMoreDemanded(orders)

    console.log(`Restaurante mais pedido: ${moreDemandedMerchants[0].merchant.name} (${moreDemandedMerchants[0].qtd})`)
    console.log(`Total de pedidos concluidos: ${getConcluded(orders).length}`)
    console.log(`Valor total gasto: ${pipeSum(orders)}`)
}

get()
