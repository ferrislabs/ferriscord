import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { UseFormReturn } from 'react-hook-form'
import type { AddServerFormValues } from '@/lib/validation/add-server-schema'

interface AddServerFormProps {
  form: UseFormReturn<AddServerFormValues>
  onSubmit: (values: AddServerFormValues) => void
  loading?: boolean
}

export function AddServerForm({ form, onSubmit, loading = false }: AddServerFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Server Name</FormLabel>
              <FormControl>
                <Input placeholder='My Awesome Server' {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end gap-2 pt-4'>
          <Button type='submit' disabled={loading}>
            {loading ? 'Creating...' : 'Create Server'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
