{{/*
Expand the name of the chart.
*/}}
{{- define "fanz-ecosystem.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "fanz-ecosystem.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "fanz-ecosystem.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "fanz-ecosystem.labels" -}}
helm.sh/chart: {{ include "fanz-ecosystem.chart" . }}
{{ include "fanz-ecosystem.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "fanz-ecosystem.selectorLabels" -}}
app.kubernetes.io/name: {{ include "fanz-ecosystem.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "fanz-ecosystem.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "fanz-ecosystem.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Get image repository
*/}}
{{- define "fanz-ecosystem.image" -}}
{{- $registry := .Values.global.registry }}
{{- $repository := .Values.global.repository }}
{{- $service := .service }}
{{- $tag := .Values.image.tag }}
{{- printf "%s/%s/fanz-%s:%s" $registry $repository $service $tag }}
{{- end }}
