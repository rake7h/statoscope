import { joraHelpers as webpackJoraHelpers, normalize } from '@statoscope/webpack-model';
import { jora as joraHelpers } from '@statoscope/helpers';
import { Node } from '@statoscope/webpack-model/dist/modules-to-foam-tree';
import {
  NormalizedAsset,
  NormalizedCompilation,
  NormalizedModule,
} from '@statoscope/webpack-model/types';
import type { Size } from '@statoscope/stats-extension-compressed/dist/generator';
import type { Instance } from '@statoscope/stats-extension-package-info/dist/generator';
import { PrepareFn } from '@statoscope/types';
import settings, {
  SETTING_ASSETS_INJECT_TYPE,
  SETTING_ASSETS_INJECT_TYPE_DEFAULT,
  SETTING_EXCLUDE_RESOURCES_FROM_SIZE_CALC,
  SETTING_EXCLUDE_RESOURCES_FROM_SIZE_CALC_DEFAULT,
  SETTING_HIDE_CHILD_COMPILATIONS,
  SETTING_HIDE_CHILD_COMPILATIONS_DEFAULT,
  SETTING_HIDE_NODE_MODULES,
  SETTING_HIDE_NODE_MODULES_DEFAULT,
  SETTING_LIST_ITEMS_LIMIT,
  SETTING_LIST_ITEMS_LIMIT_DEFAULT,
  SETTING_NETWORK_SPEED,
  SETTING_NETWORK_SPEED_DEFAULT,
  SETTING_SHOW_COMPRESSED,
  SETTING_SHOW_COMPRESSED_DEFAULT,
} from '../../settings';
import { RawData, StatoscopeWidget, TargetData } from '../../../types';

export default (() =>
  (rawData: RawData, { addQueryHelpers, query }: StatoscopeWidget): unknown => {
    const normalizeResult = normalize(rawData);
    const wpJoraHelpers = webpackJoraHelpers(normalizeResult, { query });
    const commonJoraHelpers = joraHelpers();

    addQueryHelpers({
      ...wpJoraHelpers,
      ...commonJoraHelpers,

      encodeURIComponent: encodeURIComponent,
      decodeURIComponent: decodeURIComponent,
      modulesToFoamTree(modules: NormalizedModule[], hash?: string): Node {
        return wpJoraHelpers.modulesToFoamTree(
          modules,
          hash,
          settings.get(SETTING_SHOW_COMPRESSED, SETTING_SHOW_COMPRESSED_DEFAULT).get()
        );
      },
      getModuleSize(module: NormalizedModule, hash: string, compressed?: boolean): Size {
        return wpJoraHelpers.getModuleSize(
          module,
          hash,
          typeof compressed === 'boolean'
            ? compressed
            : settings.get(SETTING_SHOW_COMPRESSED, SETTING_SHOW_COMPRESSED_DEFAULT).get()
        );
      },
      getAssetSize(asset: NormalizedAsset, hash: string, compressed?: boolean): Size {
        return wpJoraHelpers.getAssetSize(
          asset,
          hash,
          typeof compressed === 'boolean'
            ? compressed
            : settings.get(SETTING_SHOW_COMPRESSED, SETTING_SHOW_COMPRESSED_DEFAULT).get()
        );
      },
      getPackageInstanceInfo(
        packageName: string,
        instancePath: string,
        hash: string
      ): Instance | null {
        return wpJoraHelpers.getPackageInstanceInfo(packageName, instancePath, hash);
      },
      getDownloadTime(size: number, networkType?: string): number {
        if (networkType == null) {
          networkType = settings
            .get(SETTING_NETWORK_SPEED, SETTING_NETWORK_SPEED_DEFAULT)
            .get();
        }

        return commonJoraHelpers.getDownloadTime(size, networkType);
      },
      setting(name: string, defaultValue: unknown) {
        return settings.get(name, defaultValue).get();
      },
      shouldHideModule(module?: NormalizedModule): boolean {
        if (!module) {
          return false;
        }

        const shouldHide = settings
          .get(SETTING_HIDE_NODE_MODULES, SETTING_HIDE_NODE_MODULES_DEFAULT)
          .get();
        const resource = module.resolvedResource;

        if (!shouldHide || !resource) {
          return false;
        }

        return !!resource.match(/node_modules/);
      },
      shouldHideCompilation(compilation?: NormalizedCompilation) {
        if (!compilation) {
          return true;
        }

        const shouldHide = settings
          .get(SETTING_HIDE_CHILD_COMPILATIONS, SETTING_HIDE_CHILD_COMPILATIONS_DEFAULT)
          .get();

        return shouldHide && compilation.isChild;
      },
      settingListItemsLimit() {
        return settings
          .get(SETTING_LIST_ITEMS_LIMIT, SETTING_LIST_ITEMS_LIMIT_DEFAULT)
          .get();
      },
      settingShowCompressed() {
        return settings
          .get(SETTING_SHOW_COMPRESSED, SETTING_SHOW_COMPRESSED_DEFAULT)
          .get();
      },
      settingNetworkType() {
        return settings.get(SETTING_NETWORK_SPEED, SETTING_NETWORK_SPEED_DEFAULT).get();
      },
      settingAssetsInjectType() {
        return settings
          .get(SETTING_ASSETS_INJECT_TYPE, SETTING_ASSETS_INJECT_TYPE_DEFAULT)
          .get();
      },
      settingExcludeResourceFromCalc(): string {
        return settings
          .get(
            SETTING_EXCLUDE_RESOURCES_FROM_SIZE_CALC,
            SETTING_EXCLUDE_RESOURCES_FROM_SIZE_CALC_DEFAULT
          )
          .get();
      },
      shouldExcludeResource(resource: string): boolean {
        // @ts-ignore
        const rxSource = this.settingExcludeResourceFromCalc() || '';

        if (!rxSource) {
          return false;
        }

        const rx = new RegExp(rxSource);

        return !!resource.match(rx);
      },
    });

    return normalizeResult.files;
  }) as () => PrepareFn<RawData, TargetData>;
