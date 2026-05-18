import { yupResolver } from '@hookform/resolvers/yup'
import { Link, Stack, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { ScrollView, Text, View } from 'react-native'

import { Button, HandleResponse, Logo, TextField } from '@/components'
import { useAppDispatch } from '@/hooks'
import { useCreateUserMutation } from '@/services'
import { userLogin } from '@/store'
import { registerSchema, devLog } from '@/utils'

export default function RegisterScreen() {
  //? Assets
  const dispatch = useAppDispatch()
  const router = useRouter()

  //? Create User
  const [createUser, { data, isSuccess, isError, isLoading, error }] = useCreateUserMutation()

  //? Form Hook
  const {
    handleSubmit,
    formState: { errors: formErrors },
    setFocus,
    control,
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  //? Focus On Mount
  useEffect(() => {
    setFocus('name')
  }, [])

  //? Handlers
  const onSubmit = ({ name, email, password }) => {
    if (name && email && password) {
      devLog.info('auth', 'register: submitting', { name, email })
      createUser({
        body: { name, email, password },
      })
    }
  }

  const onSuccess = () => {
    devLog.info('auth', 'register: success — storing token and navigating back')
    dispatch(userLogin(data.data.token))
    router.back()
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Register',
          headerBackTitleVisible: false,
        }}
      />
      {/* Handle Login Response */}
      {(isSuccess || isError) && (
        <HandleResponse
          isError={isError}
          isSuccess={isSuccess}
          error={error?.data?.message}
          message="Registration Successful"
          onSuccess={onSuccess}
        />
      )}
      <ScrollView className="h-[100%] bg-white pt-10">
        <View className="w-[100vw] px-8 py-6 space-y-4">
          <Logo className="mx-auto w-40 h-16" />
          <Text className=" mt-56">Register</Text>
          <View className="space-y-0">
            <TextField
              errors={formErrors.name}
              placeholder="Please enter your account name"
              name="name"
              control={control}
            />
            <TextField
              errors={formErrors.email}
              placeholder="Please enter your account email"
              name="email"
              keyboardType="email-address"
              autoCapitalize="none"
              control={control}
            />

            <TextField
              errors={formErrors.password}
              secureTextEntry
              placeholder="Please enter your account password"
              name="password"
              control={control}
            />
            <TextField
              control={control}
              errors={formErrors.confirmPassword}
              secureTextEntry
              placeholder="Confirm password, please enter again"
              name="confirmPassword"
            />
            <Button isLoading={isLoading} onPress={handleSubmit(onSubmit)}>
              register
            </Button>
          </View>
          <View className="flex flex-row">
            <Text className="inline mr-2 text-gray-800 text-xs">I already have an account</Text>
            <Link replace href="/login" className="text-blue-400 text-xs">
              Go to login
            </Link>
          </View>
        </View>
      </ScrollView>
    </>
  )
}
