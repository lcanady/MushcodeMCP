export interface MushcodeServerType {
  name: string;
  version?: string;
  dialect: string;
}

export interface MushcodeFunction {
  name: string;
  description: string;
  parameters: string[];
  returnType?: string;
  example?: string;
}

export interface SecurityLevel {
  level: 'public' | 'builder' | 'wizard' | 'god';
  description: string;
}

export interface GenerationOptions {
  serverType?: string;
  functionType?: string;
  parameters?: string[];
  securityLevel?: string;
  includeComments?: boolean;
}