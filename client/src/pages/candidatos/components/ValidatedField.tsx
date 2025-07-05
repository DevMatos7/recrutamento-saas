import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface ValidatedFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'date' | 'number' | 'textarea' | 'select' | 'password';
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    customValidation?: (value: string) => string | null;
  };
  className?: string;
}

export function ValidatedField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  validation,
  className = '',
}: ValidatedFieldProps) {
  const handleChange = (newValue: string) => {
    // Permite digitação livre, validação só no blur ou submit
    onChange(newValue);
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur();
    }
  };

  const renderField = () => {
    const commonProps = {
      id: name,
      name,
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleChange(e.target.value),
      onBlur: handleBlur,
      placeholder,
      disabled,
      className: `w-full ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`,
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={4}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value === '' ? undefined : (value as string)}
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger className={error ? 'border-red-500 focus:border-red-500' : ''}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {/* Renderiza explicitamente o placeholder se necessário */}
              {options.some(option => option.value === '') && (
                <SelectItem key="placeholder" value="">
                  {placeholder || 'Selecione...'}
                </SelectItem>
              )}
              {options.filter(option => option.value !== '').map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            {...commonProps}
            type={type}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      {renderField()}
      
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}

// Componente específico para CPF com formatação automática
export function CPFField(props: Omit<ValidatedFieldProps, 'type'>) {
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleChange = (value: string) => {
    const formatted = formatCPF(value);
    props.onChange(formatted);
  };

  return (
    <ValidatedField
      {...props}
      type="text"
      placeholder="000.000.000-00"
      validation={{
        pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
        customValidation: (value) => {
          if (!value) return null;
          if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value)) {
            return 'CPF deve estar no formato 000.000.000-00';
          }
          return null;
        },
      }}
      onChange={handleChange}
    />
  );
}

// Componente específico para CEP com formatação automática
export function CEPField(props: Omit<ValidatedFieldProps, 'type'>) {
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleChange = (value: string) => {
    const formatted = formatCEP(value);
    props.onChange(formatted);
  };

  return (
    <ValidatedField
      {...props}
      type="text"
      placeholder="00000-000"
      validation={{
        pattern: /^\d{5}-\d{3}$/,
        customValidation: (value) => {
          if (!value) return null;
          if (!/^\d{5}-\d{3}$/.test(value)) {
            return 'CEP deve estar no formato 00000-000';
          }
          return null;
        },
      }}
      onChange={handleChange}
    />
  );
}

// Componente específico para telefone com formatação automática
export function PhoneField(props: Omit<ValidatedFieldProps, 'type'>) {
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const handleChange = (value: string) => {
    const formatted = formatPhone(value);
    props.onChange(formatted);
  };

  return (
    <ValidatedField
      {...props}
      type="tel"
      placeholder="(00) 00000-0000"
      validation={{
        pattern: /^\(\d{2}\) \d{4,5}-\d{4}$/,
        customValidation: (value) => {
          if (!value) return null;
          if (!/^\(\d{2}\) \d{4,5}-\d{4}$/.test(value)) {
            return 'Telefone deve estar no formato (00) 00000-0000';
          }
          return null;
        },
      }}
      onChange={handleChange}
    />
  );
} 