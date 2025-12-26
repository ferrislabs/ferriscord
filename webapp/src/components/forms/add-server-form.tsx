import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { UseFormReturn } from "react-hook-form"
import type { AddServerFormValues } from "@/lib/validation/add-server-schema"

interface AddServerFormProps {
  form: UseFormReturn<AddServerFormValues>
  onSubmit: (values: AddServerFormValues) => void
  loading?: boolean
}

export function AddServerForm({ form, onSubmit, loading = false }: AddServerFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Server Name</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Server" {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your server..."
                  className="resize-none"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                A brief description of your server and its purpose.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="picture_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Picture URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/image.png"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="banner_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banner URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/banner.png"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visibility</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose who can see and join your server.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Server"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
