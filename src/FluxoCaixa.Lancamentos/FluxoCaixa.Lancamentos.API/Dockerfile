FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/FluxoCaixa.Lancamentos/FluxoCaixa.Lancamentos.API/FluxoCaixa.Lancamentos.API.csproj", "src/FluxoCaixa.Lancamentos/FluxoCaixa.Lancamentos.API/"]
COPY ["src/FluxoCaixa.Lancamentos/FluxoCaixa.Lancamentos.Infrastructure/FluxoCaixa.Lancamentos.Infrastructure.csproj", "src/FluxoCaixa.Lancamentos/FluxoCaixa.Lancamentos.Infrastructure/"]
COPY ["src/FluxoCaixa.Lancamentos/FluxoCaixa.Lancamentos.Application/FluxoCaixa.Lancamentos.Application.csproj", "src/FluxoCaixa.Lancamentos/FluxoCaixa.Lancamentos.Application/"]
COPY ["src/FluxoCaixa.Lancamentos/FluxoCaixa.Lancamentos.Domain/FluxoCaixa.Lancamentos.Domain.csproj", "src/FluxoCaixa.Lancamentos/FluxoCaixa.Lancamentos.Domain/"]
COPY ["src/FluxoCaixa.Shared/FluxoCaixa.Shared/FluxoCaixa.Shared.csproj", "src/FluxoCaixa.Shared/FluxoCaixa.Shared/"]

RUN dotnet restore "src/FluxoCaixa.Lancamentos/FluxoCaixa.Lancamentos.API/FluxoCaixa.Lancamentos.API.csproj"

# Copy everything else
COPY . .

WORKDIR "/src/src/FluxoCaixa.Lancamentos/FluxoCaixa.Lancamentos.API"
RUN dotnet build "FluxoCaixa.Lancamentos.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FluxoCaixa.Lancamentos.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "FluxoCaixa.Lancamentos.API.dll"]
