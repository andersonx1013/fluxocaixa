FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/FluxoCaixa.Consolidado/FluxoCaixa.Consolidado.API/FluxoCaixa.Consolidado.API.csproj", "src/FluxoCaixa.Consolidado/FluxoCaixa.Consolidado.API/"]
COPY ["src/FluxoCaixa.Consolidado/FluxoCaixa.Consolidado.Infrastructure/FluxoCaixa.Consolidado.Infrastructure.csproj", "src/FluxoCaixa.Consolidado/FluxoCaixa.Consolidado.Infrastructure/"]
COPY ["src/FluxoCaixa.Consolidado/FluxoCaixa.Consolidado.Application/FluxoCaixa.Consolidado.Application.csproj", "src/FluxoCaixa.Consolidado/FluxoCaixa.Consolidado.Application/"]
COPY ["src/FluxoCaixa.Consolidado/FluxoCaixa.Consolidado.Domain/FluxoCaixa.Consolidado.Domain.csproj", "src/FluxoCaixa.Consolidado/FluxoCaixa.Consolidado.Domain/"]
COPY ["src/FluxoCaixa.Shared/FluxoCaixa.Shared/FluxoCaixa.Shared.csproj", "src/FluxoCaixa.Shared/FluxoCaixa.Shared/"]

RUN dotnet restore "src/FluxoCaixa.Consolidado/FluxoCaixa.Consolidado.API/FluxoCaixa.Consolidado.API.csproj"

# Copy everything else
COPY . .

WORKDIR "/src/src/FluxoCaixa.Consolidado/FluxoCaixa.Consolidado.API"
RUN dotnet build "FluxoCaixa.Consolidado.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FluxoCaixa.Consolidado.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "FluxoCaixa.Consolidado.API.dll"]
