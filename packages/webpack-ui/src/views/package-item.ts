import { NormalizedPackage } from '../../../webpack-model/dist/normalize';
import { StatoscopeWidget } from '../../types';
// @ts-ignore
import style from './badge-margin-fix.css';

export default function (discovery: StatoscopeWidget): void {
  discovery.view.define(
    'package-item',
    (
      el,
      config,
      data?: { inline?: boolean; compact?: boolean; package: NormalizedPackage },
      context?
    ) => {
      const { inline = false } = data || {};

      el.classList.add(style.root);

      if (inline) {
        el.classList.add('inline-block');
      }

      discovery.view.render(
        el,
        [
          {
            view: 'link',
            data: `{
            text: package.name,
            href: package.name.pageLink("package", {hash:hash or #.params.hash}),
            match
          }`,
            content: 'text-match',
          },
          {
            when: 'not compact and showInstancesTotal!=false and package.instances.size() > 1',
            view: 'badge',
            data: "{text: \"+\" + (package.instances.size() - 1), postfix: (package.instances.size()-1).plural(['copy', 'copies'])}",
          },
          {
            when: `
            $hash: hash;
            $package: package;
            not compact and $package.instances.($package.name.getInstanceInfo(path, $hash or #.params.hash)).info.version.size() > 1
            `,
            view: 'badge',
            data: `
            $hash: hash;
            $package: package;
            $size: $package.instances.($package.name.getInstanceInfo(path, $hash or #.params.hash)).info.version.size();
            {
              $package,
              text: $size,
              postfix: $size.plural(['version', 'versions'])
            }
            `,
          },
        ],
        data,
        context
      );
    }
  );
}
