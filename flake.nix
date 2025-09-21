{
  description = "A Nix-flake-based typescript dev environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs
            pnpm
            stdenv.cc.cc.lib
            playwright
            playwright-driver
            chromium
            glib
            nspr
            nss
            atk
            at-spi2-atk
            at-spi2-core
            cups
            expat
            libxcb
            libxkbcommon
            dbus
            gtk3
            pango
            cairo
            libdrm
            mesa
            libgbm
            systemd
            alsa-lib
            xorg.libX11
            xorg.libXcomposite
            xorg.libXdamage
            xorg.libXext
            xorg.libXfixes
            xorg.libXrandr
          ];
          shellHook = ''
              export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [
                pkgs.stdenv.cc.cc.lib pkgs.glib pkgs.nspr pkgs.nss pkgs.cups pkgs.expat pkgs.libxcb
                pkgs.libxkbcommon pkgs.dbus pkgs.at-spi2-atk pkgs.at-spi2-core pkgs.atk pkgs.xorg.libX11
                pkgs.xorg.libXcomposite pkgs.xorg.libXdamage pkgs.xorg.libXext pkgs.xorg.libXfixes
                pkgs.xorg.libXrandr pkgs.mesa pkgs.libgbm pkgs.libdrm pkgs.cairo pkgs.pango pkgs.systemd pkgs.alsa-lib
                pkgs.gtk3
              ]}:$LD_LIBRARY_PATH
              export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
              export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
              export PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium
            '';
        };
      }
    );
}
