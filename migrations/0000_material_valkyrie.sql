CREATE TABLE "avaliacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidato_id" uuid,
	"tipo" varchar(10) DEFAULT 'DISC',
	"data_inicio" timestamp DEFAULT now(),
	"data_fim" timestamp,
	"resultado_json" jsonb,
	"status" varchar(20) DEFAULT 'em_andamento'
);
--> statement-breakpoint
CREATE TABLE "candidatos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"telefone" varchar(50) NOT NULL,
	"password" text,
	"cpf" varchar(14),
	"data_nascimento" date,
	"endereco" varchar(500),
	"cidade" varchar(100),
	"estado" varchar(2),
	"cep" varchar(10),
	"cargo" varchar(255),
	"resumo_profissional" text,
	"experiencia_profissional" json,
	"educacao" json,
	"habilidades" json,
	"idiomas" json,
	"certificacoes" json,
	"curriculo_url" varchar(500),
	"linkedin" varchar(255),
	"portfolio" varchar(255),
	"pretensao_salarial" varchar(50),
	"disponibilidade" varchar(50),
	"modalidade_trabalho" varchar(50),
	"status" varchar(20) DEFAULT 'ativo' NOT NULL,
	"origem" varchar(20) DEFAULT 'manual' NOT NULL,
	"status_etico" varchar(20) DEFAULT 'pendente',
	"motivo_reprovacao_etica" text,
	"empresa_id" uuid NOT NULL,
	"data_criacao" timestamp DEFAULT now() NOT NULL,
	"data_atualizacao" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comunicacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidato_id" uuid NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"canal" varchar(20) NOT NULL,
	"assunto" varchar(255),
	"mensagem" text NOT NULL,
	"status_envio" varchar(20) DEFAULT 'pendente' NOT NULL,
	"data_agendada" timestamp,
	"data_envio" timestamp,
	"erro" text,
	"enviado_por" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"empresa_id" uuid NOT NULL,
	"data_criacao" timestamp DEFAULT now() NOT NULL,
	"data_atualizacao" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"cnpj" varchar(18),
	"email" varchar(255),
	"telefone" varchar(50),
	"site" varchar(500),
	"status" varchar(20) DEFAULT 'ativa' NOT NULL,
	"data_criacao" timestamp DEFAULT now() NOT NULL,
	"data_atualizacao" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "empresas_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "entrevistas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vaga_id" uuid NOT NULL,
	"candidato_id" uuid NOT NULL,
	"entrevistador_id" uuid NOT NULL,
	"data_hora" timestamp NOT NULL,
	"local" varchar(255),
	"status" varchar(20) DEFAULT 'agendada' NOT NULL,
	"plataforma" varchar(20),
	"link_entrevista" varchar(500),
	"confirmado" boolean DEFAULT false,
	"confirmado_candidato" boolean DEFAULT false,
	"confirmado_entrevistador" boolean DEFAULT false,
	"token_confirmacao_candidato" varchar(100),
	"token_confirmacao_entrevistador" varchar(100),
	"data_confirmacao_candidato" timestamp,
	"data_confirmacao_entrevistador" timestamp,
	"avaliacao_posterior" jsonb,
	"observacoes" text,
	"data_criacao" timestamp DEFAULT now() NOT NULL,
	"data_atualizacao" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questoes_disc" (
	"id" serial PRIMARY KEY NOT NULL,
	"bloco" varchar(2),
	"ordem" smallint,
	"frase" text,
	"fator" char(1)
);
--> statement-breakpoint
CREATE TABLE "respostas_disc" (
	"id" serial PRIMARY KEY NOT NULL,
	"avaliacao_id" integer,
	"bloco" varchar(2),
	"respostas" jsonb
);
--> statement-breakpoint
CREATE TABLE "testes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"descricao" text,
	"questoes" json NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"data_criacao" timestamp DEFAULT now() NOT NULL,
	"data_atualizacao" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testes_resultados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teste_id" uuid NOT NULL,
	"candidato_id" uuid NOT NULL,
	"vaga_id" uuid NOT NULL,
	"respostas" json,
	"resultado" text,
	"pontuacao" numeric(5, 2),
	"status" varchar(20) DEFAULT 'pendente' NOT NULL,
	"data_envio" timestamp DEFAULT now() NOT NULL,
	"data_resposta" timestamp
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"perfil" varchar(50) NOT NULL,
	"empresa_id" uuid NOT NULL,
	"departamento_id" uuid,
	"ativo" integer DEFAULT 1 NOT NULL,
	"data_criacao" timestamp DEFAULT now() NOT NULL,
	"data_atualizacao" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vaga_candidatos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vaga_id" uuid NOT NULL,
	"candidato_id" uuid NOT NULL,
	"etapa" varchar(50) DEFAULT 'recebido' NOT NULL,
	"nota" numeric(3, 1),
	"comentarios" text,
	"data_movimentacao" timestamp DEFAULT now() NOT NULL,
	"data_inscricao" timestamp DEFAULT now() NOT NULL,
	"responsavel_id" uuid
);
--> statement-breakpoint
CREATE TABLE "vagas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"descricao" text NOT NULL,
	"requisitos" text,
	"local" varchar(255) NOT NULL,
	"salario" varchar(100),
	"beneficios" text,
	"tipo_contratacao" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'aberta' NOT NULL,
	"data_abertura" timestamp DEFAULT now() NOT NULL,
	"data_fechamento" timestamp,
	"empresa_id" uuid NOT NULL,
	"departamento_id" uuid NOT NULL,
	"gestor_id" uuid NOT NULL,
	"data_criacao" timestamp DEFAULT now() NOT NULL,
	"data_atualizacao" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comunicacoes" ADD CONSTRAINT "comunicacoes_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comunicacoes" ADD CONSTRAINT "comunicacoes_enviado_por_usuarios_id_fk" FOREIGN KEY ("enviado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_vaga_id_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_entrevistador_id_usuarios_id_fk" FOREIGN KEY ("entrevistador_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respostas_disc" ADD CONSTRAINT "respostas_disc_avaliacao_id_avaliacoes_id_fk" FOREIGN KEY ("avaliacao_id") REFERENCES "public"."avaliacoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testes_resultados" ADD CONSTRAINT "testes_resultados_teste_id_testes_id_fk" FOREIGN KEY ("teste_id") REFERENCES "public"."testes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testes_resultados" ADD CONSTRAINT "testes_resultados_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testes_resultados" ADD CONSTRAINT "testes_resultados_vaga_id_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga_candidatos" ADD CONSTRAINT "vaga_candidatos_vaga_id_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga_candidatos" ADD CONSTRAINT "vaga_candidatos_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga_candidatos" ADD CONSTRAINT "vaga_candidatos_responsavel_id_usuarios_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vagas" ADD CONSTRAINT "vagas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vagas" ADD CONSTRAINT "vagas_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vagas" ADD CONSTRAINT "vagas_gestor_id_usuarios_id_fk" FOREIGN KEY ("gestor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_entrevista_ativa" ON "entrevistas" USING btree ("vaga_id","candidato_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_teste_candidato" ON "testes_resultados" USING btree ("teste_id","candidato_id","vaga_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_vaga_candidato" ON "vaga_candidatos" USING btree ("vaga_id","candidato_id");