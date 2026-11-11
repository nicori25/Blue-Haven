FROM php:8.3-apache
RUN docker-php-ext-install pdo_mysql
WORKDIR /var/www/html
COPY . .
RUN printf 'ServerTokens Prod\nServerSignature Off\n<Directory /var/www/html>\nOptions -Indexes\nAllowOverride All\n</Directory>\n' > /etc/apache2/conf-available/bluehaven.conf && a2enconf bluehaven
EXPOSE 80
