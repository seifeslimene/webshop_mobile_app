import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SubmitModalBtn } from '../common/Buttons'
import Combobox from '../common/Combobox'
import DisplayError from '../common/DisplayError'
import HandleResponse from '../common/HandleResponse'
import Modal from '../common/Modal'
import TextField from '../common/TextField'

import { useEditUserMutation } from '@/services'
import { EU_MEMBER_COUNTRIES } from '@/utils/euCountries'
import { addressSchema } from '@/utils'

const inputClass =
  'w-full px-3 py-2.5 transition-colors border border-gray-200 rounded-md outline-none bg-zinc-50/30 focus:border-blue-600 leading-none'

const AddressModal = props => {
  const { isShow, onClose, address } = props

  const insets = useSafeAreaInsets()

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors: formErrors },
  } = useForm({
    resolver: yupResolver(addressSchema),
    defaultValues: address,
  })

  const [editUser, { data, isSuccess, isLoading, isError, error }] = useEditUserMutation()

  useEffect(() => {
    if (!isShow) return
    reset({
      province: address?.province ?? {},
      city: address?.city ?? {},
      area: address?.area ?? {},
      street: address?.street ?? '',
      postalCode: address?.postalCode != null ? String(address.postalCode) : '',
    })
  }, [isShow, address, reset])

  const submitHander = addressPayload => {
    editUser({
      body: { address: addressPayload },
    })
  }

  return (
    <>
      {(isSuccess || isError) && (
        <HandleResponse
          isError={isError}
          isSuccess={isSuccess}
          error={error?.data?.message}
          message={data?.message}
          onSuccess={onClose}
        />
      )}

      <Modal isShow={isShow} onClose={onClose} effect="bottom-to-top" className="m-0">
        <Modal.Content
          onClose={onClose}
          style={{ paddingTop: insets.top }}
          className="flex flex-col w-[100vw] h-[100vh] m-0 px-5 py-3 bg-white"
        >
          <Modal.Header onClose={onClose}>Address Management</Modal.Header>
          <Modal.Body>
            <Text>Please enter your shipping address (EU)</Text>
            <View className="flex flex-col justify-between flex-1 mt-4 overflow-y-auto">
              <View className="space-y-2">
                <View className="space-y-2">
                  <Combobox
                    control={control}
                    name="province"
                    list={EU_MEMBER_COUNTRIES}
                    placeholder="Please select your country"
                  />
                  <DisplayError errors={formErrors.province?.name} />
                </View>

                <View className="space-y-2">
                  <Text className="text-xs text-gray-700">City</Text>
                  <Controller
                    control={control}
                    name="city"
                    render={({ field }) => (
                      <TextInput
                        className={inputClass}
                        value={field.value?.name ?? ''}
                        onBlur={field.onBlur}
                        onChangeText={text => field.onChange({ ...field.value, name: text })}
                        placeholder="City"
                        style={{ marginTop: 10 }}
                      />
                    )}
                  />
                  <DisplayError errors={formErrors.city?.name} />
                </View>

                <View className="space-y-2">
                  <Text className="text-xs text-gray-700">Region / district</Text>
                  <Controller
                    control={control}
                    name="area"
                    render={({ field }) => (
                      <TextInput
                        className={inputClass}
                        value={field.value?.name ?? ''}
                        onBlur={field.onBlur}
                        onChangeText={text => field.onChange({ ...field.value, name: text })}
                        placeholder="Region, district, or borough"
                        style={{ marginTop: 10 }}
                      />
                    )}
                  />
                  <DisplayError errors={formErrors.area?.name} />
                </View>

                <TextField
                  label="Street and house number"
                  control={control}
                  errors={formErrors.street}
                  name="street"
                />

                <TextField
                  label="Postal code"
                  control={control}
                  errors={formErrors.postalCode}
                  name="postalCode"
                  direction="ltr"
                  inputMode="text"
                />
              </View>

              <View className="py-3 border-t-2 border-gray-200 lg:pb-0 flex">
                <SubmitModalBtn
                  isLoading={isLoading}
                  className="ml-auto"
                  onPress={handleSubmit(submitHander)}
                >
                  Sure
                </SubmitModalBtn>
              </View>
            </View>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default AddressModal
