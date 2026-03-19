export namespace Schemas {
  // <Schemas>
  export type ApiError =
    | { Unknown: { message: string } }
    | 'TokenNotFound'
    | { InvalidToken: { message: string } }
  export type ApiErrorResponse = {
    code: string
    message: string
    status: number
  }
  export type AutoArchiveDuration =
    | 'OneHour'
    | 'OneDay'
    | 'ThreeDays'
    | 'OneWeek'
  export type ForumTag = {
    emoji_id?: (string | null) | undefined
    emoji_name?: (string | null) | undefined
    id: string
    moderated: boolean
    name: string
  }
  export type ForumLayout = 'NotSet' | 'ListView' | 'GalleryView'
  export type DefaultReaction = Partial<{
    emoji_id: string | null
    emoji_name: string | null
  }>
  export type SortOrder = 'LatestActivity' | 'CreationDate'
  export type ChannelFlags = number
  export type Id = string
  export type ChannelKind =
    | 'Text'
    | 'Voice'
    | 'Category'
    | 'Announcement'
    | 'Stage'
    | 'Forum'
  export type OverwriteKind = 'Role' | 'Member'
  export type PermissionOverwrite = {
    allow: number
    deny: number
    id: string
    kind: OverwriteKind
  }
  export type Channel = {
    available_tags: Array<ForumTag>
    bitrate?: (number | null) | undefined
    created_at: string
    default_auto_archive_duration?: (null | AutoArchiveDuration) | undefined
    default_forum_layout?: (null | ForumLayout) | undefined
    default_reaction_emoji?: (null | DefaultReaction) | undefined
    default_sort_order?: (null | SortOrder) | undefined
    default_thread_rate_limit_per_user: number
    flags: ChannelFlags
    guild_id: Id
    id: Id
    kind: ChannelKind
    last_message_id?: (string | null) | undefined
    last_pin_timestamp?: (string | null) | undefined
    name: string
    nsfw: boolean
    parent_id?: (null | Id) | undefined
    permission_overwrites: Array<PermissionOverwrite>
    position: number
    rate_limit_per_user: number
    rtc_region?: (string | null) | undefined
    topic?: (string | null) | undefined
    user_limit?: (number | null) | undefined
  }
  export type ChannelId = Id
  export type CreateChannelRequest = {
    available_tags?: (Array<ForumTag> | null) | undefined
    bitrate?: (number | null) | undefined
    default_auto_archive_duration?: (null | AutoArchiveDuration) | undefined
    default_forum_layout?: (null | ForumLayout) | undefined
    default_reaction_emoji?: (null | DefaultReaction) | undefined
    default_sort_order?: (null | SortOrder) | undefined
    default_thread_rate_limit_per_user?: (number | null) | undefined
    flags?: (number | null) | undefined
    kind: ChannelKind
    name: string
    nsfw?: (boolean | null) | undefined
    parent_id?: (string | null) | undefined
    permission_overwrites?: (Array<PermissionOverwrite> | null) | undefined
    position?: (number | null) | undefined
    rate_limit_per_user?: (number | null) | undefined
    rtc_region?: (string | null) | undefined
    topic?: (string | null) | undefined
    user_limit?: (number | null) | undefined
  }
  export type CreateGuildRequest = { name: string }
  export type CreateRoleRequest = {
    color: number
    name: string
    permissions: number
  }
  export type DeleteRoleResponse = { message: string }
  export type Permissions = unknown
  export type Role = {
    color: number
    created_at: string
    guild_id: Id
    hoist: boolean
    id: Id
    mentionable: boolean
    name: string
    permissions: Permissions
    position: number
  }
  export type GetRolesResponse = { data: Array<Role> }
  export type Guild = {
    created_at: string
    id: Id
    name: string
    owner_id: Id
    slug: string
  }
  export type GuildId = Id
  export type OwnerId = Id
  export type RoleId = Id
  export type MessageId = Id
  export type UserId = Id
  export type MessageAuthor = {
    id: UserId
    username: string
    avatar_url?: (string | null) | undefined
  }
  export type Message = {
    id: MessageId
    channel_id: ChannelId
    author: MessageAuthor
    content: string
    edited_at?: (string | null) | undefined
    created_at: string
  }

  // </Schemas>
}

export namespace Endpoints {
  // <Endpoints>

  export type post_Create_guild_handler = {
    method: 'POST'
    path: '/guilds'
    requestFormat: 'json'
    parameters: {
      body: Schemas.CreateGuildRequest
    }
    responses: {
      201: Schemas.Guild
      401: Schemas.ApiError
      403: Schemas.ApiError
      500: Schemas.ApiError
    }
  }
  export type delete_Delete_guild_handler = {
    method: 'DELETE'
    path: '/guilds/{guild_id}'
    requestFormat: 'json'
    parameters: {
      path: { guild_id: string }
    }
    responses: {
      204: unknown
      400: Schemas.ApiError
      401: Schemas.ApiError
      403: Schemas.ApiError
      500: Schemas.ApiError
    }
  }
  export type get_Get_channels_handler = {
    method: 'GET'
    path: '/guilds/{guild_id}/channels'
    requestFormat: 'json'
    parameters: {
      path: { guild_id: string }
    }
    responses: {
      200: Array<Schemas.Channel>
      401: Schemas.ApiError
      404: Schemas.ApiError
      500: Schemas.ApiError
    }
  }
  export type post_Create_channel_handler = {
    method: 'POST'
    path: '/guilds/{guild_id}/channels'
    requestFormat: 'json'
    parameters: {
      path: { guild_id: string }

      body: Schemas.CreateChannelRequest
    }
    responses: {
      201: Schemas.Channel
      400: Schemas.ApiError
      401: Schemas.ApiError
      403: Schemas.ApiError
      404: Schemas.ApiError
      500: Schemas.ApiError
    }
  }
  export type get_Get_roles_handler = {
    method: 'GET'
    path: '/guilds/{guild_id}/roles'
    requestFormat: 'json'
    parameters: {
      path: { guild_id: string }
    }
    responses: {
      200: Schemas.GetRolesResponse
      400: Schemas.ApiError
      401: Schemas.ApiError
      403: Schemas.ApiError
      500: Schemas.ApiError
    }
  }
  export type post_Create_role_handler = {
    method: 'POST'
    path: '/guilds/{guild_id}/roles'
    requestFormat: 'json'
    parameters: {
      path: { guild_id: string }

      body: Schemas.CreateRoleRequest
    }
    responses: {
      201: Schemas.Role
      400: unknown
      401: unknown
      403: unknown
      500: unknown
    }
  }
  export type get_Get_role_handler = {
    method: 'GET'
    path: '/guilds/{guild_id}/roles/{role_id}'
    requestFormat: 'json'
    parameters: {
      path: { guild_id: string; role_id: string }
    }
    responses: {
      200: Schemas.Role
      400: Schemas.ApiError
      401: Schemas.ApiError
      403: Schemas.ApiError
      500: Schemas.ApiError
    }
  }
  export type delete_Delete_role_handler = {
    method: 'DELETE'
    path: '/guilds/{guild_id}/roles/{role_id}'
    requestFormat: 'json'
    parameters: {
      path: { guild_id: string; role_id: string }
    }
    responses: {
      200: Schemas.DeleteRoleResponse
      400: Schemas.ApiError
      401: Schemas.ApiError
      403: Schemas.ApiError
      500: Schemas.ApiError
    }
  }
  export type get_Get_messages_handler = {
    method: 'GET'
    path: '/guilds/{guild_id}/channels/{channel_id}/messages'
    requestFormat: 'json'
    parameters: {
      path: { guild_id: string; channel_id: string }
      query?: { before?: string; limit?: number }
    }
    responses: {
      200: Array<Schemas.Message>
      401: Schemas.ApiError
      403: Schemas.ApiError
      404: Schemas.ApiError
      500: Schemas.ApiError
    }
  }
  export type get_Get_user_guilds = {
    method: 'GET'
    path: '/users/@me/guilds'
    requestFormat: 'json'
    parameters: never
    responses: {
      200: Array<Schemas.Guild>
      400: Schemas.ApiErrorResponse
      401: Schemas.ApiErrorResponse
      403: Schemas.ApiErrorResponse
      500: Schemas.ApiErrorResponse
    }
  }

  // </Endpoints>
}

// <EndpointByMethod>
export type EndpointByMethod = {
  post: {
    '/guilds': Endpoints.post_Create_guild_handler
    '/guilds/{guild_id}/channels': Endpoints.post_Create_channel_handler
    '/guilds/{guild_id}/roles': Endpoints.post_Create_role_handler
  }
  delete: {
    '/guilds/{guild_id}': Endpoints.delete_Delete_guild_handler
    '/guilds/{guild_id}/roles/{role_id}': Endpoints.delete_Delete_role_handler
  }
  get: {
    '/guilds/{guild_id}/channels': Endpoints.get_Get_channels_handler
    '/guilds/{guild_id}/channels/{channel_id}/messages': Endpoints.get_Get_messages_handler
    '/guilds/{guild_id}/roles': Endpoints.get_Get_roles_handler
    '/guilds/{guild_id}/roles/{role_id}': Endpoints.get_Get_role_handler
    '/users/@me/guilds': Endpoints.get_Get_user_guilds
  }
}

// </EndpointByMethod>

// <EndpointByMethod.Shorthands>
export type PostEndpoints = EndpointByMethod['post']
export type DeleteEndpoints = EndpointByMethod['delete']
export type GetEndpoints = EndpointByMethod['get']
// </EndpointByMethod.Shorthands>

// <ApiClientTypes>
export type EndpointParameters = {
  body?: unknown
  query?: Record<string, unknown>
  header?: Record<string, unknown>
  path?: Record<string, unknown>
}

export type MutationMethod = 'post' | 'put' | 'patch' | 'delete'
export type Method = 'get' | 'head' | 'options' | MutationMethod

type RequestFormat = 'json' | 'form-data' | 'form-url' | 'binary' | 'text'

export type DefaultEndpoint = {
  parameters?: EndpointParameters | undefined
  responses?: Record<string, unknown>
  responseHeaders?: Record<string, unknown>
}

export type Endpoint<TConfig extends DefaultEndpoint = DefaultEndpoint> = {
  operationId: string
  method: Method
  path: string
  requestFormat: RequestFormat
  parameters?: TConfig['parameters']
  meta: {
    alias: string
    hasParameters: boolean
    areParametersRequired: boolean
  }
  responses?: TConfig['responses']
  responseHeaders?: TConfig['responseHeaders']
}

export interface Fetcher {
  decodePathParams?: (
    path: string,
    pathParams: Record<string, string>,
  ) => string
  encodeSearchParams?: (
    searchParams: Record<string, unknown> | undefined,
  ) => URLSearchParams
  //
  fetch: (input: {
    method: Method
    url: URL
    urlSearchParams?: URLSearchParams | undefined
    parameters?: EndpointParameters | undefined
    path: string
    overrides?: RequestInit
    throwOnStatusError?: boolean
  }) => Promise<Response>
  parseResponseData?: (response: Response) => Promise<unknown>
}

export const successStatusCodes = [
  200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304,
  305, 306, 307, 308,
] as const
export type SuccessStatusCode = (typeof successStatusCodes)[number]

export const errorStatusCodes = [
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414,
  415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500,
  501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
] as const
export type ErrorStatusCode = (typeof errorStatusCodes)[number]

// Taken from https://github.com/unjs/fetchdts/blob/ec4eaeab5d287116171fc1efd61f4a1ad34e4609/src/fetch.ts#L3
export interface TypedHeaders<
  TypedHeaderValues extends Record<string, string> | unknown,
> extends Omit<
  Headers,
  'append' | 'delete' | 'get' | 'getSetCookie' | 'has' | 'set' | 'forEach'
> {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Headers/append) */
  append: <
    Name extends Extract<keyof TypedHeaderValues, string> | (string & {}),
  >(
    name: Name,
    value: Lowercase<Name> extends keyof TypedHeaderValues
      ? TypedHeaderValues[Lowercase<Name>]
      : string,
  ) => void
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Headers/delete) */
  delete: <
    Name extends Extract<keyof TypedHeaderValues, string> | (string & {}),
  >(
    name: Name,
  ) => void
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Headers/get) */
  get: <Name extends Extract<keyof TypedHeaderValues, string> | (string & {})>(
    name: Name,
  ) =>
    | (Lowercase<Name> extends keyof TypedHeaderValues
        ? TypedHeaderValues[Lowercase<Name>]
        : string)
    | null
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Headers/getSetCookie) */
  getSetCookie: () => string[]
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Headers/has) */
  has: <Name extends Extract<keyof TypedHeaderValues, string> | (string & {})>(
    name: Name,
  ) => boolean
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Headers/set) */
  set: <Name extends Extract<keyof TypedHeaderValues, string> | (string & {})>(
    name: Name,
    value: Lowercase<Name> extends keyof TypedHeaderValues
      ? TypedHeaderValues[Lowercase<Name>]
      : string,
  ) => void
  forEach: (
    callbackfn: (
      value: TypedHeaderValues[keyof TypedHeaderValues] | (string & {}),
      key: Extract<keyof TypedHeaderValues, string> | (string & {}),
      parent: TypedHeaders<TypedHeaderValues>,
    ) => void,
    thisArg?: any,
  ) => void
}

/** @see https://developer.mozilla.org/en-US/docs/Web/API/Response */
export interface TypedSuccessResponse<
  TSuccess,
  TStatusCode,
  THeaders,
> extends Omit<Response, 'ok' | 'status' | 'json' | 'headers'> {
  ok: true
  status: TStatusCode
  headers: never extends THeaders ? Headers : TypedHeaders<THeaders>
  data: TSuccess
  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) */
  json: () => Promise<TSuccess>
}

/** @see https://developer.mozilla.org/en-US/docs/Web/API/Response */
export interface TypedErrorResponse<TData, TStatusCode, THeaders> extends Omit<
  Response,
  'ok' | 'status' | 'json' | 'headers'
> {
  ok: false
  status: TStatusCode
  headers: never extends THeaders ? Headers : TypedHeaders<THeaders>
  data: TData
  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) */
  json: () => Promise<TData>
}

export type TypedApiResponse<
  TAllResponses extends Record<string | number, unknown> = {},
  THeaders = {},
> = {
  [K in keyof TAllResponses]: K extends string
    ? K extends `${infer TStatusCode extends number}`
      ? TStatusCode extends SuccessStatusCode
        ? TypedSuccessResponse<
            TAllResponses[K],
            TStatusCode,
            K extends keyof THeaders ? THeaders[K] : never
          >
        : TypedErrorResponse<
            TAllResponses[K],
            TStatusCode,
            K extends keyof THeaders ? THeaders[K] : never
          >
      : never
    : K extends number
      ? K extends SuccessStatusCode
        ? TypedSuccessResponse<
            TAllResponses[K],
            K,
            K extends keyof THeaders ? THeaders[K] : never
          >
        : TypedErrorResponse<
            TAllResponses[K],
            K,
            K extends keyof THeaders ? THeaders[K] : never
          >
      : never
}[keyof TAllResponses]

export type SafeApiResponse<TEndpoint> = TEndpoint extends {
  responses: infer TResponses
}
  ? TResponses extends Record<string, unknown>
    ? TypedApiResponse<
        TResponses,
        TEndpoint extends { responseHeaders: infer THeaders } ? THeaders : never
      >
    : never
  : never

export type InferResponseByStatus<TEndpoint, TStatusCode> = Extract<
  SafeApiResponse<TEndpoint>,
  { status: TStatusCode }
>

type RequiredKeys<T> = {
  [P in keyof T]-?: undefined extends T[P] ? never : P
}[keyof T]

type MaybeOptionalArg<T> =
  RequiredKeys<T> extends never ? [config?: T] : [config: T]
type NotNever<T> = [T] extends [never] ? false : true

// </ApiClientTypes>

// <TypedStatusError>
export class TypedStatusError<TData = unknown> extends Error {
  response: TypedErrorResponse<TData, ErrorStatusCode, unknown>
  status: number
  constructor(response: TypedErrorResponse<TData, ErrorStatusCode, unknown>) {
    super(`HTTP ${response.status}: ${response.statusText}`)
    this.name = 'TypedStatusError'
    this.response = response
    this.status = response.status
  }
}
// </TypedStatusError>

// <ApiClient>
export class ApiClient {
  baseUrl: string = ''
  successStatusCodes = successStatusCodes
  errorStatusCodes = errorStatusCodes

  constructor(public fetcher: Fetcher) {}

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl
    return this
  }

  /**
   * Replace path parameters in URL
   * Supports both OpenAPI format {param} and Express format :param
   */
  defaultDecodePathParams = (
    url: string,
    params: Record<string, string>,
  ): string => {
    return url
      .replace(/{(\w+)}/g, (_, key: string) => params[key] || `{${key}}`)
      .replace(
        /:([a-zA-Z0-9_]+)/g,
        (_, key: string) => params[key] || `:${key}`,
      )
  }

  /** Uses URLSearchParams, skips null/undefined values */
  defaultEncodeSearchParams = (
    queryParams: Record<string, unknown> | undefined,
  ): URLSearchParams | undefined => {
    if (!queryParams) return

    const searchParams = new URLSearchParams()
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value != null) {
        // Skip null/undefined values
        if (Array.isArray(value)) {
          value.forEach(
            (val) => val != null && searchParams.append(key, String(val)),
          )
        } else {
          searchParams.append(key, String(value))
        }
      }
    })

    return searchParams
  }

  defaultParseResponseData = async (response: Response): Promise<unknown> => {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.startsWith('text/')) {
      return await response.text()
    }

    if (contentType === 'application/octet-stream') {
      return await response.arrayBuffer()
    }

    if (
      contentType.includes('application/json') ||
      (contentType.includes('application/') && contentType.includes('json')) ||
      contentType === '*/*'
    ) {
      try {
        return await response.json()
      } catch {
        return undefined
      }
    }

    return
  }

  // <ApiClient.post>
  post<Path extends keyof PostEndpoints, TEndpoint extends PostEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<
      TEndpoint extends { parameters: infer UParams }
        ? NotNever<UParams> extends true
          ? UParams & {
              overrides?: RequestInit
              withResponse?: false
              throwOnStatusError?: boolean
            }
          : {
              overrides?: RequestInit
              withResponse?: false
              throwOnStatusError?: boolean
            }
        : {
            overrides?: RequestInit
            withResponse?: false
            throwOnStatusError?: boolean
          }
    >
  ): Promise<
    Extract<
      InferResponseByStatus<TEndpoint, SuccessStatusCode>,
      { data: {} }
    >['data']
  >

  post<Path extends keyof PostEndpoints, TEndpoint extends PostEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<
      TEndpoint extends { parameters: infer UParams }
        ? NotNever<UParams> extends true
          ? UParams & {
              overrides?: RequestInit
              withResponse?: true
              throwOnStatusError?: boolean
            }
          : {
              overrides?: RequestInit
              withResponse?: true
              throwOnStatusError?: boolean
            }
        : {
            overrides?: RequestInit
            withResponse?: true
            throwOnStatusError?: boolean
          }
    >
  ): Promise<SafeApiResponse<TEndpoint>>

  post<
    Path extends keyof PostEndpoints,
    _TEndpoint extends PostEndpoints[Path],
  >(path: Path, ...params: MaybeOptionalArg<any>): Promise<any> {
    return this.request('post', path, ...params)
  }
  // </ApiClient.post>

  // <ApiClient.delete>
  delete<
    Path extends keyof DeleteEndpoints,
    TEndpoint extends DeleteEndpoints[Path],
  >(
    path: Path,
    ...params: MaybeOptionalArg<
      TEndpoint extends { parameters: infer UParams }
        ? NotNever<UParams> extends true
          ? UParams & {
              overrides?: RequestInit
              withResponse?: false
              throwOnStatusError?: boolean
            }
          : {
              overrides?: RequestInit
              withResponse?: false
              throwOnStatusError?: boolean
            }
        : {
            overrides?: RequestInit
            withResponse?: false
            throwOnStatusError?: boolean
          }
    >
  ): Promise<
    Extract<
      InferResponseByStatus<TEndpoint, SuccessStatusCode>,
      { data: {} }
    >['data']
  >

  delete<
    Path extends keyof DeleteEndpoints,
    TEndpoint extends DeleteEndpoints[Path],
  >(
    path: Path,
    ...params: MaybeOptionalArg<
      TEndpoint extends { parameters: infer UParams }
        ? NotNever<UParams> extends true
          ? UParams & {
              overrides?: RequestInit
              withResponse?: true
              throwOnStatusError?: boolean
            }
          : {
              overrides?: RequestInit
              withResponse?: true
              throwOnStatusError?: boolean
            }
        : {
            overrides?: RequestInit
            withResponse?: true
            throwOnStatusError?: boolean
          }
    >
  ): Promise<SafeApiResponse<TEndpoint>>

  delete<
    Path extends keyof DeleteEndpoints,
    _TEndpoint extends DeleteEndpoints[Path],
  >(path: Path, ...params: MaybeOptionalArg<any>): Promise<any> {
    return this.request('delete', path, ...params)
  }
  // </ApiClient.delete>

  // <ApiClient.get>
  get<Path extends keyof GetEndpoints, TEndpoint extends GetEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<
      TEndpoint extends { parameters: infer UParams }
        ? NotNever<UParams> extends true
          ? UParams & {
              overrides?: RequestInit
              withResponse?: false
              throwOnStatusError?: boolean
            }
          : {
              overrides?: RequestInit
              withResponse?: false
              throwOnStatusError?: boolean
            }
        : {
            overrides?: RequestInit
            withResponse?: false
            throwOnStatusError?: boolean
          }
    >
  ): Promise<
    Extract<
      InferResponseByStatus<TEndpoint, SuccessStatusCode>,
      { data: {} }
    >['data']
  >

  get<Path extends keyof GetEndpoints, TEndpoint extends GetEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<
      TEndpoint extends { parameters: infer UParams }
        ? NotNever<UParams> extends true
          ? UParams & {
              overrides?: RequestInit
              withResponse?: true
              throwOnStatusError?: boolean
            }
          : {
              overrides?: RequestInit
              withResponse?: true
              throwOnStatusError?: boolean
            }
        : {
            overrides?: RequestInit
            withResponse?: true
            throwOnStatusError?: boolean
          }
    >
  ): Promise<SafeApiResponse<TEndpoint>>

  get<Path extends keyof GetEndpoints, _TEndpoint extends GetEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<any>
  ): Promise<any> {
    return this.request('get', path, ...params)
  }
  // </ApiClient.get>

  // <ApiClient.request>
  /**
   * Generic request method with full type-safety for any endpoint
   */
  request<
    TMethod extends keyof EndpointByMethod,
    TPath extends keyof EndpointByMethod[TMethod],
    TEndpoint extends EndpointByMethod[TMethod][TPath],
  >(
    method: TMethod,
    path: TPath,
    ...params: MaybeOptionalArg<
      TEndpoint extends { parameters: infer UParams }
        ? NotNever<UParams> extends true
          ? UParams & {
              overrides?: RequestInit
              withResponse?: false
              throwOnStatusError?: boolean
            }
          : {
              overrides?: RequestInit
              withResponse?: false
              throwOnStatusError?: boolean
            }
        : {
            overrides?: RequestInit
            withResponse?: false
            throwOnStatusError?: boolean
          }
    >
  ): Promise<
    Extract<
      InferResponseByStatus<TEndpoint, SuccessStatusCode>,
      { data: {} }
    >['data']
  >

  request<
    TMethod extends keyof EndpointByMethod,
    TPath extends keyof EndpointByMethod[TMethod],
    TEndpoint extends EndpointByMethod[TMethod][TPath],
  >(
    method: TMethod,
    path: TPath,
    ...params: MaybeOptionalArg<
      TEndpoint extends { parameters: infer UParams }
        ? NotNever<UParams> extends true
          ? UParams & {
              overrides?: RequestInit
              withResponse?: true
              throwOnStatusError?: boolean
            }
          : {
              overrides?: RequestInit
              withResponse?: true
              throwOnStatusError?: boolean
            }
        : {
            overrides?: RequestInit
            withResponse?: true
            throwOnStatusError?: boolean
          }
    >
  ): Promise<SafeApiResponse<TEndpoint>>

  request<
    TMethod extends keyof EndpointByMethod,
    TPath extends keyof EndpointByMethod[TMethod],
    TEndpoint extends EndpointByMethod[TMethod][TPath],
  >(
    method: TMethod,
    path: TPath,
    ...params: MaybeOptionalArg<any>
  ): Promise<any> {
    const requestParams = params[0]
    const withResponse = requestParams?.withResponse
    const {
      withResponse: _,
      throwOnStatusError = withResponse ? false : true,
      overrides,
      ...fetchParams
    } = requestParams || {}

    const parametersToSend: EndpointParameters = {}
    if (requestParams?.body !== undefined)
      (parametersToSend as any).body = requestParams.body
    if (requestParams?.query !== undefined)
      (parametersToSend as any).query = requestParams.query
    if (requestParams?.header !== undefined)
      (parametersToSend as any).header = requestParams.header
    if (requestParams?.path !== undefined)
      (parametersToSend as any).path = requestParams.path

    const resolvedPath = (
      this.fetcher.decodePathParams ?? this.defaultDecodePathParams
    )(
      this.baseUrl + (path as string),
      (parametersToSend.path ?? {}) as Record<string, string>,
    )
    const url = new URL(resolvedPath)
    const urlSearchParams = (
      this.fetcher.encodeSearchParams ?? this.defaultEncodeSearchParams
    )(parametersToSend.query)

    const promise = this.fetcher
      .fetch({
        method: method,
        path: path as string,
        url,
        urlSearchParams,
        parameters: Object.keys(fetchParams).length ? fetchParams : undefined,
        overrides,
        throwOnStatusError,
      })
      .then(async (response) => {
        const data = await (
          this.fetcher.parseResponseData ?? this.defaultParseResponseData
        )(response)
        const typedResponse = Object.assign(response, {
          data: data,
          json: () => Promise.resolve(data),
        }) as SafeApiResponse<TEndpoint>

        if (
          throwOnStatusError &&
          errorStatusCodes.includes(response.status as never)
        ) {
          throw new TypedStatusError(typedResponse as never)
        }

        return withResponse ? typedResponse : data
      })

    return promise as Extract<
      InferResponseByStatus<TEndpoint, SuccessStatusCode>,
      { data: {} }
    >['data']
  }
  // </ApiClient.request>
}

export function createApiClient(fetcher: Fetcher, baseUrl?: string) {
  return new ApiClient(fetcher).setBaseUrl(baseUrl ?? '')
}

/**
 Example usage:
 const api = createApiClient((method, url, params) =>
   fetch(url, { method, body: JSON.stringify(params) }).then((res) => res.json()),
 );
 api.get("/users").then((users) => console.log(users));
 api.post("/users", { body: { name: "John" } }).then((user) => console.log(user));
 api.put("/users/:id", { path: { id: 1 }, body: { name: "John" } }).then((user) => console.log(user));

 // With error handling
 const result = await api.get("/users/{id}", { path: { id: "123" }, withResponse: true });
 if (result.ok) {
   // Access data directly
   const user = result.data;
   console.log(user);

   // Or use the json() method for compatibility
   const userFromJson = await result.json();
   console.log(userFromJson);
 } else {
   const error = result.data;
   console.error(`Error ${result.status}:`, error);
 }
*/

// </ApiClient>
