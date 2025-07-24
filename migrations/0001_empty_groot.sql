CREATE TABLE "candidato_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidato_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eventos_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidato_id" uuid NOT NULL,
	"data_evento" timestamp DEFAULT now() NOT NULL,
	"tipo_evento" varchar(30) NOT NULL,
	"descricao" text NOT NULL,
	"usuario_responsavel_id" uuid NOT NULL,
	"visivel_para_candidato" boolean DEFAULT false,
	"observacao_interna" text,
	"tipo_observacao" varchar(10),
	"tags" text[],
	"anexos" text[],
	"origem" varchar(20),
	"origem_externa" text,
	"mencoes" uuid[],
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historico_quadro_ideal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quadro_ideal_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"campo_alterado" varchar(50),
	"valor_anterior" text,
	"valor_novo" text,
	"data_alteracao" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historico_solicitacao_vaga" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"solicitacao_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"acao" varchar(32) NOT NULL,
	"motivo" text,
	"data" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jornadas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"horarios" jsonb NOT NULL,
	"total_horas" numeric(4, 2) NOT NULL,
	"empresa_id" uuid NOT NULL,
	"data_criacao" timestamp DEFAULT now() NOT NULL,
	"data_atualizacao" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vaga_id" uuid NOT NULL,
	"candidato_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"feedback" varchar(10) NOT NULL,
	"comentario" text,
	"data" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perfis_vaga" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome_perfil" varchar(255) NOT NULL,
	"titulo_vaga" varchar(255) NOT NULL,
	"descricao_funcao" text NOT NULL,
	"requisitos_obrigatorios" text,
	"requisitos_desejaveis" text,
	"competencias_tecnicas" jsonb DEFAULT '[]'::jsonb,
	"competencias_comportamentais" jsonb DEFAULT '[]'::jsonb,
	"beneficios" text,
	"tipo_contratacao" varchar(50) NOT NULL,
	"faixa_salarial" varchar(100),
	"empresa_id" uuid NOT NULL,
	"departamento_id" uuid NOT NULL,
	"local_atuacao" varchar(255),
	"modelo_trabalho" varchar(50),
	"observacoes_internas" text,
	"data_criacao" timestamp DEFAULT now() NOT NULL,
	"data_atualizacao" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vaga_id" uuid NOT NULL,
	"candidato_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"acao" varchar(32) NOT NULL,
	"etapa_anterior" varchar(50),
	"etapa_nova" varchar(50),
	"nota" varchar(10),
	"comentarios" text,
	"data_movimentacao" timestamp DEFAULT now() NOT NULL,
	"ip" varchar(64),
	"detalhes" jsonb
);
--> statement-breakpoint
CREATE TABLE "pipeline_etapas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(100) NOT NULL,
	"ordem" integer NOT NULL,
	"cor" varchar(10) DEFAULT '#df7826',
	"empresa_id" uuid,
	"vaga_id" uuid,
	"campos_obrigatorios" jsonb DEFAULT '[]'::jsonb,
	"responsaveis" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "quadro_ideal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"departamento_id" uuid NOT NULL,
	"cargo" varchar(100) NOT NULL,
	"quantidade_ideal" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quadro_real" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"departamento_id" uuid NOT NULL,
	"cargo" varchar(100) NOT NULL,
	"quantidade_atual" integer NOT NULL,
	"atualizado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"categoria" varchar(100),
	"codigo_externo" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "solicitacoes_vaga" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"departamento_id" uuid NOT NULL,
	"cargo" varchar(100) NOT NULL,
	"quantidade_solicitada" integer NOT NULL,
	"motivo" text,
	"status" varchar(20) DEFAULT 'pendente' NOT NULL,
	"criado_por" uuid NOT NULL,
	"aprovado_por" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vaga_auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vaga_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"acao" varchar(32) NOT NULL,
	"data" timestamp DEFAULT now() NOT NULL,
	"detalhes" text
);
--> statement-breakpoint
CREATE TABLE "vaga_matching_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vaga_id" uuid NOT NULL,
	"competencias_peso" integer NOT NULL,
	"experiencia_peso" integer NOT NULL,
	"formacao_peso" integer NOT NULL,
	"localizacao_peso" integer NOT NULL,
	"salario_peso" integer NOT NULL,
	"disc_peso" integer NOT NULL,
	"score_minimo" integer NOT NULL,
	"data" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vaga_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vaga_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidato_skills" ADD CONSTRAINT "candidato_skills_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidato_skills" ADD CONSTRAINT "candidato_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos_timeline" ADD CONSTRAINT "eventos_timeline_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos_timeline" ADD CONSTRAINT "eventos_timeline_usuario_responsavel_id_usuarios_id_fk" FOREIGN KEY ("usuario_responsavel_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_quadro_ideal" ADD CONSTRAINT "historico_quadro_ideal_quadro_ideal_id_quadro_ideal_id_fk" FOREIGN KEY ("quadro_ideal_id") REFERENCES "public"."quadro_ideal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_quadro_ideal" ADD CONSTRAINT "historico_quadro_ideal_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_solicitacao_vaga" ADD CONSTRAINT "historico_solicitacao_vaga_solicitacao_id_solicitacoes_vaga_id_fk" FOREIGN KEY ("solicitacao_id") REFERENCES "public"."solicitacoes_vaga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_solicitacao_vaga" ADD CONSTRAINT "historico_solicitacao_vaga_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jornadas" ADD CONSTRAINT "jornadas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_vaga_id_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfis_vaga" ADD CONSTRAINT "perfis_vaga_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfis_vaga" ADD CONSTRAINT "perfis_vaga_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_auditoria" ADD CONSTRAINT "pipeline_auditoria_vaga_id_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_auditoria" ADD CONSTRAINT "pipeline_auditoria_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_auditoria" ADD CONSTRAINT "pipeline_auditoria_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_etapas" ADD CONSTRAINT "pipeline_etapas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_etapas" ADD CONSTRAINT "pipeline_etapas_vaga_id_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quadro_ideal" ADD CONSTRAINT "quadro_ideal_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quadro_ideal" ADD CONSTRAINT "quadro_ideal_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quadro_real" ADD CONSTRAINT "quadro_real_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quadro_real" ADD CONSTRAINT "quadro_real_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes_vaga" ADD CONSTRAINT "solicitacoes_vaga_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes_vaga" ADD CONSTRAINT "solicitacoes_vaga_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes_vaga" ADD CONSTRAINT "solicitacoes_vaga_criado_por_usuarios_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes_vaga" ADD CONSTRAINT "solicitacoes_vaga_aprovado_por_usuarios_id_fk" FOREIGN KEY ("aprovado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga_auditoria" ADD CONSTRAINT "vaga_auditoria_vaga_id_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga_auditoria" ADD CONSTRAINT "vaga_auditoria_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga_matching_config" ADD CONSTRAINT "vaga_matching_config_vaga_id_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga_skills" ADD CONSTRAINT "vaga_skills_vaga_id_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga_skills" ADD CONSTRAINT "vaga_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_eventos_timeline_candidato" ON "eventos_timeline" USING btree ("candidato_id","data_evento","tipo_evento");