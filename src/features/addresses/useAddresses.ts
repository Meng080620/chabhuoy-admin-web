import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import { useIsAuthenticated } from '@/store/auth'
import type { Address } from '@/types/api'
import { createAddress, listAddresses, setDefaultAddress } from './addressService'

/** The signed-in user's shipping addresses (default first). */
export function useAddresses() {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: queryKeys.addresses.all(),
    queryFn: listAddresses,
    enabled: isAuthenticated,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAddress,
    // Creating may flip the default server-side, so refetch the whole list
    // rather than trust a local insert.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all() })
    },
  })
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: Address['id']) => setDefaultAddress(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all() })
    },
  })
}
