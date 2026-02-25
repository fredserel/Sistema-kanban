'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Save, Loader2, Mail, Globe, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';
import { settingsService, Setting } from '@/services/settings.service';

function SettingsGroup({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function SettingField({
  setting,
  value,
  onChange,
}: {
  setting: Setting;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={setting.key} className="text-sm font-medium">
        {setting.label}
      </Label>
      <div className="relative">
        <Input
          id={setting.key}
          type={setting.encrypted && !showSecret ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(setting.key, e.target.value)}
          placeholder={setting.description}
          className="pr-10"
        />
        {setting.encrypted && (
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400">{setting.description}</p>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.isSuperAdmin === true;

  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const load = async () => {
      try {
        setLoading(true);
        const data = await settingsService.getAll();
        setSettings(data);
        const vals: Record<string, string> = {};
        for (const s of data) {
          vals[s.key] = s.value || '';
        }
        setValues(vals);
      } catch (err) {
        setError('Erro ao carregar configuracoes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isSuperAdmin]);

  const handleChange = (key: string, value: string) => {
    setSaved(false);
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updates = Object.entries(values).map(([key, value]) => ({ key, value }));
      await settingsService.update(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <ShieldAlert className="h-16 w-16 text-gray-400" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Acesso Restrito</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Apenas Super Administradores podem acessar as configuracoes do sistema.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const emailSettings = settings.filter((s) => s.group === 'email');
  const generalSettings = settings.filter((s) => s.group === 'general');

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuracoes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configuracoes gerais e de integracao do sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <SettingsGroup
        title="E-mail (Amazon SES)"
        description="Configure o envio de notificacoes por e-mail via AWS SES"
        icon={Mail}
      >
        {emailSettings.map((setting) => (
          <SettingField
            key={setting.key}
            setting={setting}
            value={values[setting.key] || ''}
            onChange={handleChange}
          />
        ))}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400">
            Deixe os campos AWS em branco para desativar o envio de e-mails.
            As notificacoes serao registradas apenas no log do servidor.
          </p>
        </div>
      </SettingsGroup>

      <SettingsGroup
        title="Geral"
        description="Configuracoes basicas da aplicacao"
        icon={Globe}
      >
        {generalSettings.map((setting) => (
          <SettingField
            key={setting.key}
            setting={setting}
            value={values[setting.key] || ''}
            onChange={handleChange}
          />
        ))}
      </SettingsGroup>
    </div>
  );
}
