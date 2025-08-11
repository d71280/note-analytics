# WordPress 403エラー トラブルシューティング

## 1. WordPressの.htaccessを確認

`.htaccess`に以下を追加してREST APIへのアクセスを許可：

```apache
# REST API許可
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule ^wp-json/ - [L]
</IfModule>

# Basic認証のヘッダー許可
RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
```

## 2. WordPressのセキュリティプラグインを確認

以下のプラグインがREST APIをブロックしている可能性：
- Wordfence Security
- iThemes Security
- All In One WP Security
- CloudFlare

**対処法：**
1. プラグインを一時的に無効化してテスト
2. REST APIのホワイトリスト設定を追加

## 3. wp-config.phpに以下を追加

```php
// REST API認証を有効化
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

// Basic認証を許可
if (!defined('REST_REQUEST')) {
    define('REST_REQUEST', true);
}
```

## 4. functions.phpに認証フィルターを追加

```php
// REST API認証を改善
add_filter('rest_authentication_errors', function($result) {
    // ログ出力で認証問題をデバッグ
    if (!empty($result)) {
        error_log('REST API Auth Error: ' . print_r($result, true));
    }
    return $result;
}, 999);

// Basic認証ヘッダーの修正
add_filter('rest_pre_dispatch', function($result, $server, $request) {
    $authorization = $request->get_header('authorization');
    if ($authorization) {
        $_SERVER['HTTP_AUTHORIZATION'] = $authorization;
    }
    return $result;
}, 10, 3);
```

## 5. サーバー設定の確認

### Apache
```apache
# .htaccessまたはhttpd.conf
<Directory /var/www/html>
    AllowOverride All
    <RequireAll>
        Require all granted
    </RequireAll>
</Directory>
```

### Nginx
```nginx
location ~ /wp-json/ {
    try_files $uri $uri/ /index.php?$args;
    
    # Basic認証ヘッダーをPHPに渡す
    fastcgi_pass_header Authorization;
    fastcgi_param HTTP_AUTHORIZATION $http_authorization;
}
```

## 6. デバッグ用コード

WordPressのfunctions.phpに追加：

```php
// REST APIリクエストをログ記録
add_action('rest_api_init', function() {
    error_log('REST API Request: ' . $_SERVER['REQUEST_URI']);
    error_log('Auth Header: ' . $_SERVER['HTTP_AUTHORIZATION'] ?? 'none');
    error_log('User: ' . wp_get_current_user()->user_login ?? 'not authenticated');
});
```

## 7. 確認コマンド（ターミナル）

```bash
# curlで直接テスト
curl -X GET \
  https://muchino-chi.com/wp-json/wp/v2/users/me \
  -H "Authorization: Basic $(echo -n 'admin_muchinochi:477SITKyRdnhRa0QnnGGEN4S' | base64)" \
  -H "Content-Type: application/json" \
  -v
```

## 8. CloudFlareを使用している場合

CloudFlareダッシュボードで：
1. Security → WAF → Tools
2. IP Access Rules でVercelのIPを許可
3. Page Rules で `/wp-json/*` のセキュリティを緩和

## 9. WordPress管理画面での確認

1. 設定 → パーマリンク → 変更を保存（リライトルールをリフレッシュ）
2. ユーザー → プロフィール → アプリケーションパスワードの再生成
3. ツール → サイトヘルス → REST APIのステータス確認