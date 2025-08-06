declare module 'oauth-1.0a' {
  interface ConsumerData {
    key: string
    secret: string
  }

  interface TokenData {
    key: string
    secret: string
  }

  interface RequestData {
    url: string
    method: string
    data?: any
  }

  interface OAuthOptions {
    consumer: ConsumerData
    signature_method: string
    hash_function(base_string: string, key: string): string
  }

  class OAuth {
    constructor(options: OAuthOptions)
    authorize(request: RequestData, token?: TokenData): any
    toHeader(authorization: any): { Authorization: string }
  }

  export = OAuth
}