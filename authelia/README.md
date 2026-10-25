# Usage

Please see the documentation covering the [Bundles](https://www.authelia.com/integration/deployment/docker/#bundles)
and the [lite](https://www.authelia.com/integration/deployment/docker/#lite) bundle for usage instructions.

How to configure a new password:

```
docker run --rm authelia/authelia:latest authelia crypto hash generate argon2 --password 'YourNewPassword'   
```