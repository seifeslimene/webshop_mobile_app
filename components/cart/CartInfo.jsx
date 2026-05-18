import { Text, View } from 'react-native'

import { Button } from '../common/Buttons'

import { useAppSelector } from '@/hooks'
import { formatNumber } from '@/utils'

const CartInfo = props => {
  //? Porps
  const { handleRoute, cart } = props

  //? Store
  const { totalItems, totalPrice, totalDiscount } = useAppSelector(state => state.cart)

  //? Render(s)
  return (
    <View className="px-4 py-2 mt-2 space-y-5 lg:mt-0 lg:h-fit lg:py-4">
      {/* total cart price */}
      <View className="pb-2 border-b border-gray-200 flex flex-row justify-between">
        <Text className="text-sm">Product price ({formatNumber(totalItems)} items)</Text>
        <View className="flex-center flex-row">
          <Text className="">{formatNumber(totalPrice)}</Text>
          <Text className="ml-1">€</Text>
        </View>
      </View>

      {/* total cart items */}
      <View className="flex flex-row justify-between">
        <Text>Total shopping cart</Text>
        <View className="flex-center flex-row">
          <Text className="text-sm">{formatNumber(totalPrice - totalDiscount)}</Text>
          <Text className="ml-1">€</Text>
        </View>
      </View>

      <Text className="inline-block w-full pb-2 border-b border-gray-200">
        Shipping costs are calculated based on your shipment's address, delivery time, weight, and
        volume
      </Text>

      {/* total cart profit */}
      <View className="flex flex-row justify-between">
        <Text className="text-red-500">The amount you saved from your purchase</Text>
        <View className="flex-center flex-row gap-x-1">
          <Text className="text-red-500 text-sm">
            ({((totalDiscount / totalPrice) * 100).toFixed(1)}%)
          </Text>
          <Text className="text-red-500">{formatNumber(totalDiscount)}</Text>
          <Text className="ml-1 text-red-500">€</Text>
        </View>
      </View>
    </View>
  )
}

export default CartInfo
