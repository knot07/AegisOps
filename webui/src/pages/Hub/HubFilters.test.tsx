import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HubFilters from './HubFilters';

describe('Hub filters', () => {
  it('searches facets, prevents empty choices, selects and clears independently', async () => {
    const user=userEvent.setup(); const onChange=vi.fn(); const onClear=vi.fn();
    const props={chinese:true,types:[{value:'',label:'全部'},{value:'skill',label:'Skill',count:12}],type:'',onTypeChange:vi.fn(),onClear,
      facets:[{key:'tag',label:'技术标签',value:'',onChange,options:[{value:'',label:'全部'},{value:'api',label:'API 安全',count:5},{value:'web',label:'Web 安全',count:0}]}]};
    const {rerender}=render(<HubFilters {...props}/>);
    await user.click(screen.getByRole('button',{name:'技术标签 全部'}));
    expect(screen.getByRole('button',{name:'Web 安全 0'})).toBeDisabled();
    await user.type(screen.getByRole('textbox',{name:'搜索技术标签'}),'API');
    expect(screen.queryByRole('button',{name:'Web 安全 0'})).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'API 安全 5'}));
    expect(onChange).toHaveBeenCalledWith('api');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<HubFilters {...props} facets={[{...props.facets[0],value:'api'}]}/>);
    await user.click(screen.getByRole('button',{name:'移除 技术标签'})); expect(onChange).toHaveBeenLastCalledWith('');
    await user.click(screen.getByRole('button',{name:'重置筛选'}));expect(onClear).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button',{name:'Skill 12'}));expect(props.onTypeChange).toHaveBeenCalledWith('skill');
  });
  it('closes on Escape and restores the trigger focus', async () => {
    const user=userEvent.setup();
    render(<HubFilters chinese types={[]} type="" onTypeChange={()=>{}} onClear={()=>{}} facets={[
      {key:'state',label:'状态',value:'',onChange:()=>{},options:[{value:'',label:'全部'}]},
    ]}/>);
    const trigger=screen.getByRole('button',{name:'状态 全部'});
    await user.click(trigger);expect(within(screen.getByRole('dialog')).getByRole('textbox')).toHaveFocus();
    await user.keyboard('{Escape}');expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(trigger).toHaveFocus();
  });
});
