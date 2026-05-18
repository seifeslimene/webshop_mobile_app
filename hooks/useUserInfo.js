import { router } from 'expo-router'
import { useEffect, useRef } from 'react'

import { useAppDispatch } from './useRedux'
import useVerify from './useVerify'

import { useGetUserInfoQuery } from '@/services'
import { userLogout } from '@/store'
import { devLog, sanitizeForLog } from '@/utils'

export default function useUserInfo() {
  const dispatch = useAppDispatch()
  const isVerify = useVerify()
  const loggedFetchError = useRef(false)

  const { data, isLoading, error, isError } = useGetUserInfoQuery(undefined, {
    skip: !isVerify,
  })

  useEffect(() => {
    if (!isVerify || !isError) {
      loggedFetchError.current = false
      return
    }
    if (loggedFetchError.current) return
    loggedFetchError.current = true
    devLog.warn('auth', 'useUserInfo: GET user failed — clearing session', sanitizeForLog(error))
    dispatch(userLogout())
  }, [isVerify, isError, error, dispatch])

  const isLoginVerify = !isVerify ? false : isLoading ? false : !!data?.data

  const mustAuthAction = nextAction => {
    if (!isLoginVerify) {
      return router.push('/login')
    }
    nextAction()
  }

  return {
    userInfo: data?.data,
    isVerify,
    isLoginVerify,
    mustAuthAction,
    isLoading,
    error,
    isError,
  }
}
