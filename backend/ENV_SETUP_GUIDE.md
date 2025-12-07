# 环境变量配置指南

## 📍 文件位置
`.env` 文件应该放在 **`backend/`** 目录下（与 `env.example` 同一位置）

## 🔑 如何获取连接字符串

### 1. Neon PostgreSQL 连接字符串

#### 步骤：
1. 登录 [Neon Console](https://console.neon.tech/)
2. 选择你的项目
3. 在 Dashboard 中找到 **"Connection string"** 或点击 **"Connection details"**
4. 选择 **"Connection string"** 标签
5. 复制完整的连接字符串

#### 格式示例：
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### 注意事项：
- ✅ 确保连接字符串包含 `?sslmode=require`
- ✅ 如果密码包含特殊字符（如 `@`, `#`, `%`），需要进行 URL 编码
- ✅ 直接复制 Neon 提供的连接字符串即可使用

#### 如果连接字符串包含特殊字符，需要编码：
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `=` → `%3D`

### 2. MongoDB Atlas 连接字符串

#### 步骤：
1. 登录 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 进入你的 **Cluster**
3. 点击 **"Connect"** 按钮
4. 选择 **"Connect your application"**
5. 选择 **Driver**: `Node.js`，**Version**: `5.5 or later`
6. 复制连接字符串

#### 格式示例：
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

#### 如果需要指定数据库名称：
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/encore?retryWrites=true&w=majority
```

#### 注意事项：
- ✅ `username` 和 `password` 是你的**数据库用户**凭证（不是 Atlas 账户密码）
- ✅ 如果还没有创建数据库用户，需要先在 Atlas 中创建
- ✅ 如果密码包含特殊字符，需要进行 URL 编码
- ✅ 确保 IP 地址已添加到 Atlas 的 Network Access 白名单（或使用 `0.0.0.0/0` 允许所有 IP）

### 3. JWT_SECRET

JWT_SECRET 用于加密 JWT token，应该是一个长且随机的字符串。

#### 生成方法：

**方法一：使用 Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**方法二：使用在线工具**
- 访问 https://randomkeygen.com/
- 选择 "CodeIgniter Encryption Keys"
- 复制一个密钥

**方法三：手动生成**
- 使用至少 32 个字符的随机字符串
- 可以包含字母、数字和特殊字符

## 📝 .env 文件配置示例

```env
# =====================================================
# 伺服器設定
# =====================================================
PORT=3000

# =====================================================
# PostgreSQL (Neon) 資料庫設定
# =====================================================
# 从 Neon Console 复制的完整连接字符串
NEON_DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# =====================================================
# MongoDB 資料庫設定
# =====================================================
# 从 MongoDB Atlas 复制的连接字符串
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/encore?retryWrites=true&w=majority
MONGODB_DB_NAME=encore

# =====================================================
# JWT 認證設定
# =====================================================
JWT_SECRET=你的随机密钥（至少32个字符）
```

## ✅ 验证配置

配置完成后，运行以下命令验证：

```bash
cd backend
npm run db:check
```

这会检查所有必需的环境变量是否已正确配置。

## ⚠️ 常见问题

### 问题 1：连接字符串包含特殊字符
**解决方案**：对特殊字符进行 URL 编码
- 在连接字符串中，密码部分如果有特殊字符，需要编码
- 例如：密码是 `p@ss#word`，应该写成 `p%40ss%23word`

### 问题 2：MongoDB 连接失败
**可能原因**：
1. IP 地址未添加到白名单
2. 数据库用户凭证错误
3. 连接字符串格式不正确

**解决方案**：
1. 在 Atlas 的 Network Access 中添加你的 IP 或 `0.0.0.0/0`
2. 检查数据库用户名和密码
3. 确保连接字符串格式正确

### 问题 3：Neon 连接失败
**可能原因**：
1. 连接字符串缺少 `?sslmode=require`
2. 数据库不存在
3. 凭证错误

**解决方案**：
1. 确保连接字符串包含 SSL 参数
2. 在 Neon Console 中确认数据库已创建
3. 检查用户名和密码

## 🔒 安全提示

1. **永远不要**将 `.env` 文件提交到 Git
2. `.env` 文件已在 `.gitignore` 中（应该检查确认）
3. 生产环境使用更强的 JWT_SECRET
4. 定期更换密钥

